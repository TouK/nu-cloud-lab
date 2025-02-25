#!/bin/bash


# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "Docker is not installed. Please install Docker and run the script again."
    exit 1
fi

docker build -t consumer .
docker run -it  consumer 