#!/bin/bash

VENV_NAME="producer_env"

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
    pip install -r requirements.txt
else
    echo "Virtual environment already exists, activating..."
    source $VENV_NAME/bin/activate
fi

# Run the producer script
python producer.py 