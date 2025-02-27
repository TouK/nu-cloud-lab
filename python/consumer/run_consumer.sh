#!/bin/bash

VENV_NAME="consumer_env"
PORT=6555

DEBUG=false
for arg in "$@"; do
    if [ "$arg" = "--debug" ]; then
        DEBUG=true
    fi
done

# Check if Python 3 is installed and has venv capability
if ! command -v python3 &> /dev/null; then
    echo "Error: Python 3 is not installed! Please install Python 3 and run the script again."
    exit 1
fi

if ! python3 -m venv --help &> /dev/null; then
    echo "Error: Python 3 does not have venv capability! Please install Python 3 with venv capability and run the script again."
    exit 1
fi

# Check if requirements.txt exists
if [ ! -f "requirements.txt" ]; then
    echo "Error: requirements.txt not found!"
    exit 1
fi

# Check if virtual environment exists
if [ ! -d "$VENV_NAME" ]; then
    echo "Creating virtual environment..."
    python3 -m venv $VENV_NAME
    
    # Activate virtual environment and install requirements
    source $VENV_NAME/bin/activate
    pip install -r requirements.txt > /dev/null 2>&1
else
    echo "Activating existing virtual environment..."
    source $VENV_NAME/bin/activate
    pip install -r requirements.txt > /dev/null 2>&1
fi

# Check if cloudflared is installed
if ! command -v cloudflared &> /dev/null; then
    # Check if we have a supported package manager
    if command -v apt &> /dev/null || command -v yum &> /dev/null || command -v brew &> /dev/null; then
        read -p "cloudflared is not installed. It is required to create a secure tunnel to your application. Would you like to install it? (y/n): " install_cloudflared
        if [[ "$install_cloudflared" == "y" || "$install_cloudflared" == "Y" ]]; then
            echo "Installing cloudflared..."
            # For Linux/WSL using apt
            if command -v apt &> /dev/null; then
                # Check system architecture
                ARCH=$(dpkg --print-architecture)
                if [ "$ARCH" = "arm64" ]; then
                    curl -L --output cloudflared.deb https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-arm64.deb
                else
                    curl -L --output cloudflared.deb https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
                fi
                sudo dpkg -i cloudflared.deb
                rm cloudflared.deb
            # For CentOS/RHEL using yum
            elif command -v yum &> /dev/null; then
                # Check system architecture
                ARCH=$(uname -m)
                if [ "$ARCH" = "aarch64" ]; then
                    curl -L --output cloudflared.rpm https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-arm64.rpm
                else
                    curl -L --output cloudflared.rpm https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-x86_64.rpm
                fi
                sudo yum localinstall -y cloudflared.rpm
                rm cloudflared.rpm
            # For macOS using Homebrew
            elif command -v brew &> /dev/null; then
                brew install cloudflare/cloudflare/cloudflared
            fi
        else
            echo "cloudflared installation skipped. Please install it manually from: https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation/"
            exit 1
        fi
    else
        echo "No supported package manager found. Please install cloudflared manually from: https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation/"
        exit 1
    fi
fi

# Start gunicorn in the background
echo "Starting Gunicorn server..."
gunicorn --bind 0.0.0.0:$PORT consumer:app 2>/dev/null &
GUNICORN_PID=$!

# Start cloudflared and capture its output
echo "Starting Cloudflare tunnel..."
cloudflared tunnel --url http://localhost:$PORT 2>&1 | while read line; do
    if [[ $line == *"Your quick Tunnel has been created!"* ]]; then
        # Extract the URL from the next line
        read next_line
        url=$(echo "$next_line" | grep -o 'https://[^[:space:]]*')
        echo -e "Successfully established Cloudflare tunnel.\n\nConsumer is now ready to receive messages from Nu Cloud!\n\nWebhook URL:\n(Please copy and paste this address into the 'Endpoint' field of the 'Add Subscription' form in Nu Cloud):\n\n${url}/webhook\n\nPress Ctrl+C to stop the consumer."
    fi
    # Show all output if debug mode is enabled
    if [ "$DEBUG" = true ]; then
        echo "$line"
    fi
done 2>/dev/null &
CLOUDFLARED_PID=$!

# When script is interrupted, kill both processes and clean up
trap 'echo -e "\nShutting down services..." && \
     kill $GUNICORN_PID 2>/dev/null && \
     kill $CLOUDFLARED_PID 2>/dev/null && \
     wait $GUNICORN_PID 2>/dev/null && \
     wait $CLOUDFLARED_PID 2>/dev/null && \
     echo -e "Services stopped.\n"' EXIT

# Wait for either process to exit
wait 2>/dev/null
echo -e "\nServices stopped." 