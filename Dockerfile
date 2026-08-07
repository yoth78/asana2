FROM node:20-slim

# Install OpenSSL for Prisma SQLite support
RUN apt-get update -y && apt-get install -y openssl

WORKDIR /app

# Install dependencies first (for caching)
COPY package*.json ./
RUN npm install

# Copy application files
COPY . .

# Build the frontend and Prisma client
RUN npm run build

EXPOSE 3001
CMD ["npm", "start"]
