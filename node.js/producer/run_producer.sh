#!/bin/bash

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "Node.js is not installed. Please install Node.js and run the script again."
    exit 1
fi

# Check if package.json exists
if [ ! -f "package.json" ]; then
    echo "Error: package.json not found!"
    exit 1
fi

# Check if pnpm is installed
if ! command -v pnpm &> /dev/null; then
    echo "pnpm is not installed. Installing pnpm..."
    # Try using corepack first
    if command -v corepack &> /dev/null; then
        echo "Using corepack to enable pnpm..."
        corepack enable pnpm
    else
        echo "Corepack not found, installing pnpm globally via npm..."
        npm install -g pnpm
    fi
fi

# Install dependencies if node_modules doesn't exist or if package.json has changed
if [ ! -d "node_modules" ] || [ package.json -nt node_modules ]; then
    echo "Installing dependencies..."
    pnpm install
else
    echo "Dependencies are up to date..."
fi

# Run the producer script
node producer.js "$@" 