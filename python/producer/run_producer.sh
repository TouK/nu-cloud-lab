#!/bin/bash

VENV_NAME="producer_env"


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
    echo "Virtual environment already exists, activating..."
    source $VENV_NAME/bin/activate
    pip install -r requirements.txt > /dev/null 2>&1
fi

# Run the producer script
python producer.py "$@" 