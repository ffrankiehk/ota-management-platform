# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY packages/api/package*.json ./packages/api/
COPY packages/shared/package*.json ./packages/shared/
COPY package*.json ./

# Install dependencies
RUN npm install --workspace=@ota-platform/api --workspace=@ota-platform/shared

# Copy source code
COPY packages/api ./packages/api
COPY packages/shared ./packages/shared

# Build shared package first
WORKDIR /app/packages/shared
RUN npm run build

# Build API
WORKDIR /app/packages/api
RUN npm run build

# Production stage
FROM node:18-alpine

WORKDIR /app

# Copy built files and dependencies
COPY --from=builder /app/packages/api/dist ./dist
COPY --from=builder /app/packages/api/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/shared/dist ./node_modules/@ota-platform/shared/dist
COPY --from=builder /app/packages/shared/package.json ./node_modules/@ota-platform/shared/

# Create uploads directory
RUN mkdir -p uploads bundles

EXPOSE 3000

ENV NODE_ENV=production

CMD ["node", "dist/server.js"]
