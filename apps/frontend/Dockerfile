# Build Stage
FROM oven/bun:1 AS builder

WORKDIR /app

# Copy root configuration
COPY package.json bun.lock turbo.json ./

# Copy packages
COPY packages ./packages

# Copy frontend
COPY apps/frontend ./apps/frontend

# Install dependencies (from root to handle workspaces)
RUN bun install

# Set working directory to frontend
WORKDIR /app/apps/frontend

# Build argument for Clerk Key
ARG VITE_CLERK_PUBLISHABLE_KEY
ENV VITE_CLERK_PUBLISHABLE_KEY=$VITE_CLERK_PUBLISHABLE_KEY

# Build the application
RUN bun run build

# Serve Stage
FROM nginx:alpine

# Copy built assets from builder
COPY --from=builder /app/apps/frontend/dist /usr/share/nginx/html

# Copy Nginx config
COPY apps/frontend/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
