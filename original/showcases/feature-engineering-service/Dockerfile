FROM node:20-alpine

# Install Python and build dependencies
RUN apk add --no-cache \
    python3 \
    py3-pip \
    py3-numpy \
    py3-pandas \
    g++ \
    make \
    linux-headers

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY requirements.txt ./

# Install Node.js dependencies
RUN npm ci --production

# Install Python dependencies
RUN pip3 install --no-cache-dir -r requirements.txt --break-system-packages

# Copy application code
COPY api/ ./api/
COPY features/ ./features/
COPY tsconfig.json ./

# Create cache directories
RUN mkdir -p features/cache features/snapshots features/monitoring

# Set permissions
RUN chmod +x features/compute_features.py

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => { process.exit(r.statusCode === 200 ? 0 : 1); })"

# Expose port
EXPOSE 3000

# Set environment variables
ENV NODE_ENV=production
ENV PYTHON_PATH=/usr/bin/python3

# Start the service
CMD ["npm", "start"]
