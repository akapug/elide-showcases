# Deployment Guide

This guide covers deploying Elide PocketBase Clone to production environments.

## Preparation

### 1. Build for Production

```bash
npm run build
```

This creates optimized production files in the `dist/` directory.

### 2. Environment Variables

Create a `.env.production` file:

```env
NODE_ENV=production
PORT=8090
HOST=0.0.0.0
DB_PATH=/data/db/data.db
JWT_SECRET=your-secure-secret-key-min-32-chars
STORAGE_PATH=/data/storage

# S3 Configuration (recommended for production)
STORAGE_TYPE=s3
S3_BUCKET=your-bucket-name
S3_REGION=us-east-1
S3_ACCESS_KEY_ID=your-access-key
S3_SECRET_ACCESS_KEY=your-secret-key

# SMTP (for emails)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-password
```

### 3. Security Checklist

- [ ] Change default JWT secret
- [ ] Enable HTTPS
- [ ] Set strong admin password
- [ ] Configure CORS properly
- [ ] Enable rate limiting
- [ ] Set up firewall rules
- [ ] Regular backups
- [ ] Monitor logs

## Deployment Options

### Option 1: Traditional Server (VPS)

#### 1. Install Dependencies

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install nodejs npm sqlite3

# CentOS/RHEL
sudo yum install nodejs npm sqlite
```

#### 2. Deploy Application

```bash
# Clone or upload your application
git clone https://github.com/yourrepo/pocketbase-clone
cd pocketbase-clone

# Install dependencies
npm ci --production

# Build
npm run build

# Create data directory
mkdir -p /var/pocketbase/data
mkdir -p /var/pocketbase/storage
```

#### 3. Create Systemd Service

Create `/etc/systemd/system/pocketbase.service`:

```ini
[Unit]
Description=PocketBase Clone Server
After=network.target

[Service]
Type=simple
User=pocketbase
WorkingDirectory=/opt/pocketbase-clone
ExecStart=/usr/bin/node dist/index.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production
Environment=PORT=8090
Environment=DB_PATH=/var/pocketbase/data/data.db
Environment=JWT_SECRET=your-secret-key
Environment=STORAGE_PATH=/var/pocketbase/storage

[Install]
WantedBy=multi-user.target
```

#### 4. Start Service

```bash
# Create user
sudo useradd -r -s /bin/false pocketbase

# Set permissions
sudo chown -R pocketbase:pocketbase /var/pocketbase
sudo chown -R pocketbase:pocketbase /opt/pocketbase-clone

# Enable and start
sudo systemctl enable pocketbase
sudo systemctl start pocketbase

# Check status
sudo systemctl status pocketbase
```

#### 5. Configure Nginx

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Proxy to PocketBase
    location / {
        proxy_pass http://localhost:8090;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # SSE support for real-time
    location /api/realtime {
        proxy_pass http://localhost:8090;
        proxy_http_version 1.1;
        proxy_set_header Connection '';
        proxy_buffering off;
        proxy_cache off;
        chunked_transfer_encoding off;
    }

    # File uploads
    client_max_body_size 100M;
}
```

### Option 2: Docker

#### 1. Create Dockerfile

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --production

# Copy application
COPY . .

# Build
RUN npm run build

# Create directories
RUN mkdir -p /data/db /data/storage

# Expose port
EXPOSE 8090

# Start server
CMD ["node", "dist/index.js"]
```

#### 2. Create docker-compose.yml

```yaml
version: '3.8'

services:
  pocketbase:
    build: .
    ports:
      - "8090:8090"
    volumes:
      - ./data/db:/data/db
      - ./data/storage:/data/storage
    environment:
      - NODE_ENV=production
      - PORT=8090
      - DB_PATH=/data/db/data.db
      - JWT_SECRET=${JWT_SECRET}
      - STORAGE_PATH=/data/storage
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8090/api"]
      interval: 30s
      timeout: 10s
      retries: 3

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/ssl:ro
    depends_on:
      - pocketbase
    restart: unless-stopped
```

#### 3. Deploy with Docker

```bash
# Build
docker-compose build

# Start
docker-compose up -d

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

### Option 3: Kubernetes

#### 1. Create Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: pocketbase
spec:
  replicas: 3
  selector:
    matchLabels:
      app: pocketbase
  template:
    metadata:
      labels:
        app: pocketbase
    spec:
      containers:
      - name: pocketbase
        image: your-registry/pocketbase:latest
        ports:
        - containerPort: 8090
        env:
        - name: NODE_ENV
          value: "production"
        - name: PORT
          value: "8090"
        - name: JWT_SECRET
          valueFrom:
            secretKeyRef:
              name: pocketbase-secrets
              key: jwt-secret
        volumeMounts:
        - name: data
          mountPath: /data
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
      volumes:
      - name: data
        persistentVolumeClaim:
          claimName: pocketbase-data
```

#### 2. Create Service

```yaml
apiVersion: v1
kind: Service
metadata:
  name: pocketbase
spec:
  selector:
    app: pocketbase
  ports:
  - port: 8090
    targetPort: 8090
  type: LoadBalancer
```

#### 3. Deploy

```bash
kubectl apply -f deployment.yaml
kubectl apply -f service.yaml
```

### Option 4: Cloud Platforms

#### Railway

1. Connect your GitHub repository
2. Add environment variables
3. Deploy automatically

#### Heroku

```bash
# Login
heroku login

# Create app
heroku create your-app-name

# Set environment variables
heroku config:set JWT_SECRET=your-secret
heroku config:set NODE_ENV=production

# Deploy
git push heroku main
```

#### DigitalOcean App Platform

1. Connect repository
2. Configure build command: `npm run build`
3. Configure run command: `node dist/index.js`
4. Add environment variables
5. Deploy

## Performance Optimization

### 1. Enable Caching

```nginx
# Nginx caching
proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=api_cache:10m max_size=1g inactive=60m;

location /api/records {
    proxy_cache api_cache;
    proxy_cache_valid 200 5m;
    proxy_cache_key "$scheme$request_method$host$request_uri";
}
```

### 2. Database Optimization

```typescript
// In your server config
const server = new PocketBaseServer({
  ...config,
  dbOptimize: true,
  dbCacheSize: 64000, // 64MB
});
```

### 3. CDN for Files

Use S3 + CloudFront or similar CDN for file storage:

```env
STORAGE_TYPE=s3
S3_BUCKET=your-bucket
CDN_URL=https://cdn.yourdomain.com
```

## Monitoring

### 1. Health Checks

```bash
# Basic health check
curl http://localhost:8090/api

# With monitoring service
curl -X POST https://healthchecks.io/ping/your-uuid \
  --data "$(curl -s http://localhost:8090/api)"
```

### 2. Log Management

```bash
# View logs
sudo journalctl -u pocketbase -f

# Send logs to external service
sudo journalctl -u pocketbase -f | \
  logger -t pocketbase --server logs.example.com
```

### 3. Metrics

Install monitoring tools:

```bash
# Prometheus + Grafana
docker-compose -f monitoring.yml up -d
```

## Backup Strategy

### 1. Automated Backups

```bash
#!/bin/bash
# backup.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/pocketbase"
DB_PATH="/var/pocketbase/data/data.db"

# Create backup
sqlite3 $DB_PATH ".backup '$BACKUP_DIR/backup_$DATE.db'"

# Upload to S3
aws s3 cp "$BACKUP_DIR/backup_$DATE.db" \
  "s3://your-bucket/backups/backup_$DATE.db"

# Keep only last 30 days
find $BACKUP_DIR -name "backup_*.db" -mtime +30 -delete
```

### 2. Cron Job

```bash
# Edit crontab
crontab -e

# Add daily backup at 2 AM
0 2 * * * /opt/scripts/backup.sh
```

## Scaling

### Horizontal Scaling

For read-heavy workloads:

1. Use read replicas for SQLite
2. Load balance with Nginx
3. Share file storage (S3)
4. Centralized session storage (Redis)

### Vertical Scaling

Increase server resources:

```yaml
# Kubernetes resources
resources:
  requests:
    memory: "1Gi"
    cpu: "1000m"
  limits:
    memory: "2Gi"
    cpu: "2000m"
```

## Security Best Practices

1. **HTTPS Only**: Always use SSL/TLS
2. **Rate Limiting**: Implement rate limiting
3. **CORS**: Configure CORS properly
4. **Secrets**: Use environment variables
5. **Backups**: Regular automated backups
6. **Updates**: Keep dependencies updated
7. **Monitoring**: Set up alerts
8. **Firewall**: Restrict access to necessary ports

## Troubleshooting

### High Memory Usage

```bash
# Check memory
ps aux | grep node

# Restart service
sudo systemctl restart pocketbase
```

### Database Locked

```bash
# Check for locks
sqlite3 data.db "PRAGMA busy_timeout = 5000;"

# Optimize database
sqlite3 data.db "VACUUM;"
```

### Slow Queries

```bash
# Enable query logging
DB_VERBOSE=true

# Check indexes
sqlite3 data.db ".schema"
```

## Support

For deployment assistance:
- 📖 [Documentation](../README.md)
- 💬 [Community Forum](https://github.com/elide/pocketbase-clone/discussions)
- 📧 Email: support@elide.dev
