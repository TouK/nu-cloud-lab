FROM ubuntu:latest

# Install system dependencies
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    python3-venv \
    curl \
    sudo

# Install cloudflared
RUN mkdir -p --mode=0755 /usr/share/keyrings \
    && curl -fsSL https://pkg.cloudflare.com/cloudflare-main.gpg | tee /usr/share/keyrings/cloudflare-main.gpg >/dev/null \
    && echo "deb [signed-by=/usr/share/keyrings/cloudflare-main.gpg] https://pkg.cloudflare.com/cloudflared any main" | tee /etc/apt/sources.list.d/cloudflared.list \
    && apt-get update \
    && apt-get install -y cloudflared

# Set working directory
WORKDIR /app

# Copy requirements and script
COPY requirements.txt .
COPY run_consumer.sh .
COPY consumer.py .

# Make script executable
RUN chmod +x run_consumer.sh

# Create and activate virtual environment, install dependencies
RUN python3 -m venv consumer_env \
    && . consumer_env/bin/activate \
    && pip install -r requirements.txt

# Run the consumer script
CMD ["./run_consumer.sh"] 