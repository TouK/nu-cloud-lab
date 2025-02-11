FROM node:18-slim

WORKDIR /app

COPY package*.json ./
COPY tsconfig.json ./
COPY consumer.ts ./

RUN npm install
RUN npm run build

EXPOSE 6555

CMD ["npm", "start"] 