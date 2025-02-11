#!/bin/bash

# Check if package.json exists
if [ ! -f "package.json" ]; then
    echo "Error: package.json not found!"
    exit 1
fi

# Check if pnpm is installed
if ! command -v pnpm &> /dev/null; then
    echo "Installing pnpm..."
    npm install -g pnpm
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