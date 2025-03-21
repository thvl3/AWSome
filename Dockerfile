FROM node:20-alpine

WORKDIR /app

# Copy package files for all workspaces
COPY package*.json ./
COPY frontend/package*.json ./frontend/
COPY backend/package*.json ./backend/
COPY shared/package*.json ./shared/
COPY infrastructure/package*.json ./infrastructure/
COPY tsconfig*.json ./

# Install dependencies
RUN npm install

# Copy source files
COPY . .

# Expose ports
EXPOSE 3000 3001

# Start in development mode
CMD ["npm", "run", "dev"] 