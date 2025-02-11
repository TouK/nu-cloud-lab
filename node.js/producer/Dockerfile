FROM node:22-slim

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
