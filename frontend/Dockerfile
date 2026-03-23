# syntax = docker/dockerfile:1

# Stage 1: Build
FROM node:22-slim AS build

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy workspace root files for dependency resolution
COPY pnpm-workspace.yaml pnpm-lock.yaml* package.json ./

# Copy frontend source
COPY frontend/package.json ./frontend/
RUN pnpm install --filter @workspace/frontend...

# Copy the rest of the frontend source
COPY frontend/ ./frontend/

# Set production env vars for the build
ARG VITE_API_URL
ARG VITE_SOCKET_URL
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_SOCKET_URL=$VITE_SOCKET_URL

# Build the frontend
WORKDIR /app/frontend
RUN pnpm build

# Stage 2: Serve with Nginx
FROM nginx:alpine

# Copy built files
COPY --from=build /app/frontend/dist/public /usr/share/nginx/html

# Copy nginx config
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
