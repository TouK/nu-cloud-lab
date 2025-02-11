#!/bin/bash

PORT=6555
DEBUG=false

for arg in "$@"; do
    if [ "$arg" = "--debug" ]; then
        DEBUG=true
    fi
done

# Check if package.json exists
if [ ! -f "package.json" ]; then
    echo "Error: package.json not found!"
    exit 1
fi

# Check if pnpm is installed
if ! command -v pnpm &> /dev/null; then
    echo "pnpm is not installed. Installing pnpm..."
    npm install -g pnpm
fi

# Install dependencies
echo "Installing dependencies..."
pnpm install > /dev/null 2>&1

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

# Start the Node.js server in the background
echo "Starting Node.js server..."
if [ "$DEBUG" = true ]; then
    pnpm run run_consumer &
else
    pnpm run run_consumer 2>&1 | grep -v '^{.*}$' &
fi
NODE_PID=$!

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
     kill $NODE_PID 2>/dev/null && \
     kill $CLOUDFLARED_PID 2>/dev/null && \
     wait $NODE_PID 2>/dev/null && \
     wait $CLOUDFLARED_PID 2>/dev/null && \
     echo -e "Services stopped.\n"' EXIT

# Wait for either process to exit
wait 2>/dev/null
echo -e "\nServices stopped." 