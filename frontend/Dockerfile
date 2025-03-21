FROM node:18-alpine

WORKDIR /app

# Copy package files for all workspaces
COPY package*.json ./
COPY shared/package*.json ./shared/
COPY frontend/package*.json ./frontend/

# Install dependencies
RUN npm install

# Copy source files
COPY shared ./shared
COPY frontend ./frontend

# Build shared package
WORKDIR /app/shared
RUN npm run build

# Set up frontend
WORKDIR /app/frontend
EXPOSE 3001

# No CMD needed as we mount the volume in development mode 