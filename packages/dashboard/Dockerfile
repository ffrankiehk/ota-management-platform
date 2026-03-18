# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY packages/dashboard/package*.json ./packages/dashboard/
COPY packages/shared/package*.json ./packages/shared/
COPY package*.json ./

# Install dependencies
RUN npm install --workspace=@ota-platform/dashboard --workspace=@ota-platform/shared

# Copy source code
COPY packages/dashboard ./packages/dashboard
COPY packages/shared ./packages/shared

# Build
WORKDIR /app/packages/dashboard
ARG VITE_API_URL=http://localhost:3000
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

# Production stage - serve with nginx
FROM nginx:alpine

# Copy built files
COPY --from=builder /app/packages/dashboard/dist /usr/share/nginx/html

# Copy nginx config
COPY packages/dashboard/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
