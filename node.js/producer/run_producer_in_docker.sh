#!/bin/bash

# Create Dockerfile if it doesn't exist
if [ ! -f "Dockerfile" ]; then
    cat > Dockerfile << 'EOF'
FROM node:18-slim

# Install pnpm
RUN npm install -g pnpm

WORKDIR /app

# Copy package files
COPY package.json ./

# Install dependencies
RUN pnpm install

# Copy the rest of the application
COPY . .

# Command to run the producer
CMD ["node", "producer.js"]
EOF
fi

# Build the Docker image
echo "Building Docker image..."
docker build -t producer .

# Run the container
echo "Running producer in Docker..."
docker run -it --rm \
    -v "$(pwd)/config.yaml:/app/config.yaml" \
    producer "$@" 