FROM node:18-alpine

WORKDIR /app

# Copy package files for all workspaces
COPY package*.json ./
COPY shared/package*.json ./shared/
COPY backend/package*.json ./backend/

# Install dependencies
RUN npm install

# Copy source files
COPY shared ./shared
COPY backend ./backend

# Build shared package
WORKDIR /app/shared
RUN npm run build

# Set up backend
WORKDIR /app/backend

# Expose port
EXPOSE 3000

# Start the server
CMD ["npm", "run", "dev"] 