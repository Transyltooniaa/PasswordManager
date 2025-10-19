# Backend Dockerfile
FROM node:20-alpine AS base

WORKDIR /app

# Install dependencies
COPY package.json package-lock.json* pnpm-lock.yaml* yarn.lock* ./
RUN npm ci || npm install --production

# Copy source
COPY . .

ENV NODE_ENV=production
EXPOSE 3000

CMD ["node", "server.js"]
