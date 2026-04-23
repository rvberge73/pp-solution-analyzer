FROM node:20-alpine

WORKDIR /app

# Copy package info and install dependencies
COPY package*.json ./
RUN npm install

# Copy application files
COPY server.js ./
COPY public ./public

EXPOSE 8090

CMD ["npm", "start"]
