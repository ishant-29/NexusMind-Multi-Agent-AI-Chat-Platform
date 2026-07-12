# Use a lightweight Debian Node image
FROM node:18-slim

# Install system dependencies, python, pip
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    && rm -rf /var/lib/apt/lists/*

# Configure python command to link to python3
RUN ln -sf /usr/bin/python3 /usr/bin/python

# Install PM2 globally for process management
RUN npm install -g pm2

# Set workspace
WORKDIR /usr/src/app

# --- 1. Install & Build API Gateway ---
COPY services/gateway-service/package.json ./services/gateway-service/
RUN cd services/gateway-service && npm install

# --- 2. Install Auth Service ---
COPY services/auth-service/package*.json ./services/auth-service/
RUN cd services/auth-service && npm install

# --- 3. Install User Service ---
COPY services/user-service/package*.json ./services/user-service/
RUN cd services/user-service && npm install

# --- 4. Install Conversation Service ---
COPY services/conversation-service/package*.json ./services/conversation-service/
RUN cd services/conversation-service && npm install

# --- 5. Install File Service ---
COPY services/file-service/package*.json ./services/file-service/
RUN cd services/file-service && npm install

# Copy sources for all services
COPY services/auth-service ./services/auth-service
COPY services/user-service ./services/user-service
COPY services/conversation-service ./services/conversation-service
COPY services/file-service ./services/file-service
COPY services/gateway-service ./services/gateway-service

# Build Node.js TypeScript microservices to JavaScript
RUN cd services/auth-service && npm run build
RUN cd services/user-service && npm run build
RUN cd services/conversation-service && npm run build
RUN cd services/file-service && npm run build

# --- 6. Install Python Agent Service ---
COPY services/agent-service/requirements.txt ./services/agent-service/
RUN pip install --no-cache-dir -r services/agent-service/requirements.txt

COPY services/agent-service ./services/agent-service

# Copy PM2 Ecosystem configuration
COPY ecosystem.config.js ./

# Expose container port (Render assigns $PORT to this, defaulting to 8080)
EXPOSE 8080

# Production environment settings
ENV PORT=8080
ENV NODE_ENV=production

# Start all microservices concurrently using PM2
CMD ["pm2-runtime", "start", "ecosystem.config.js"]
