FROM ubuntu:latest

# Install system dependencies
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    python3-venv

# Set working directory
WORKDIR /app

# Copy requirements and scripts
COPY requirements.txt .
COPY run_producer.sh .
COPY producer.py .
COPY config.yaml* .  # This will copy both config.yaml and config.yaml.template

# Make script executable
RUN chmod +x run_producer.sh

# Create and activate virtual environment, install dependencies
RUN python3 -m venv producer_env \
    && . producer_env/bin/activate \
    && pip install -r requirements.txt

# Run the producer script
CMD ["./run_producer.sh"] 
