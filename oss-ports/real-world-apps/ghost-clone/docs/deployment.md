# Deployment Guide

Complete guide to deploying Ghost Clone to production environments.

## Pre-Deployment Checklist

- [ ] Change default admin password
- [ ] Set secure `JWT_SECRET` environment variable
- [ ] Configure database backups
- [ ] Set up SSL/HTTPS
- [ ] Configure domain name
- [ ] Test all functionality
- [ ] Set up monitoring
- [ ] Configure email service
- [ ] Review security settings
- [ ] Optimize images and assets
- [ ] Enable caching
- [ ] Set up CDN (optional)

## Environment Configuration

### Production Environment Variables

```bash
# Server
NODE_ENV=production
HOST=0.0.0.0
PORT=3000

# Security
JWT_SECRET=<generate-strong-secret-here>

# Database
DATABASE_PATH=/var/lib/ghost-clone/ghost.db

# Media
UPLOAD_PATH=/var/lib/ghost-clone/content/images
CDN_URL=https://cdn.yourdomain.com

# Email
EMAIL_FROM=noreply@yourdomain.com
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=<your-sendgrid-api-key>
```

### Generate Secure Secrets

```bash
# Generate JWT secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

## Deployment Options

### 1. Traditional Server (VPS/Dedicated)

#### Using systemd (Linux)

**Create service file** `/etc/systemd/system/ghost-clone.service`:
```ini
[Unit]
Description=Ghost Clone Blog
After=network.target

[Service]
Type=simple
User=ghost
WorkingDirectory=/opt/ghost-clone
Environment=NODE_ENV=production
Environment=JWT_SECRET=your-secret-here
ExecStart=/usr/local/bin/elide run server.js
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

**Enable and start**:
```bash
sudo systemctl daemon-reload
sudo systemctl enable ghost-clone
sudo systemctl start ghost-clone
sudo systemctl status ghost-clone
```

#### Using PM2 (Process Manager)

```bash
# Install PM2
npm install -g pm2

# Start application
pm2 start server.js --name ghost-clone

# Save configuration
pm2 save

# Setup startup script
pm2 startup
```

**ecosystem.config.js** for PM2:
```javascript
module.exports = {
  apps: [{
    name: 'ghost-clone',
    script: 'server.js',
    interpreter: 'elide',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
};
```

### 2. Docker Deployment

**Dockerfile**:
```dockerfile
FROM elide:latest

WORKDIR /app

# Copy application files
COPY package*.json ./
COPY . .

# Install dependencies
RUN npm install --production

# Build admin dashboard
RUN cd admin && npm install && npm run build

# Create data directory
RUN mkdir -p /data

# Expose port
EXPOSE 3000

# Set environment
ENV NODE_ENV=production
ENV DATABASE_PATH=/data/ghost.db

# Run migrations on start
CMD ["sh", "-c", "elide run cli/migrate.js && elide run server.js"]
```

**docker-compose.yml**:
```yaml
version: '3.8'

services:
  ghost-clone:
    build: .
    ports:
      - "3000:3000"
    volumes:
      - ghost-data:/data
      - ghost-content:/app/content
    environment:
      - NODE_ENV=production
      - JWT_SECRET=${JWT_SECRET}
      - PORT=3000
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
    depends_on:
      - ghost-clone
    restart: unless-stopped

volumes:
  ghost-data:
  ghost-content:
```

**Build and run**:
```bash
docker-compose up -d
```

### 3. Kubernetes Deployment

**deployment.yaml**:
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ghost-clone
spec:
  replicas: 3
  selector:
    matchLabels:
      app: ghost-clone
  template:
    metadata:
      labels:
        app: ghost-clone
    spec:
      containers:
      - name: ghost-clone
        image: your-registry/ghost-clone:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
        - name: JWT_SECRET
          valueFrom:
            secretKeyRef:
              name: ghost-clone-secrets
              key: jwt-secret
        volumeMounts:
        - name: data
          mountPath: /data
        - name: content
          mountPath: /app/content
      volumes:
      - name: data
        persistentVolumeClaim:
          claimName: ghost-clone-data
      - name: content
        persistentVolumeClaim:
          claimName: ghost-clone-content
---
apiVersion: v1
kind: Service
metadata:
  name: ghost-clone
spec:
  selector:
    app: ghost-clone
  ports:
  - port: 80
    targetPort: 3000
  type: LoadBalancer
```

### 4. Platform-as-a-Service

#### Heroku

**Procfile**:
```
web: elide run server.js
release: elide run cli/migrate.js
```

**Deploy**:
```bash
heroku create my-ghost-blog
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET=$(openssl rand -hex 64)
git push heroku main
```

#### Vercel

**vercel.json**:
```json
{
  "version": 2,
  "builds": [
    {
      "src": "server.js",
      "use": "@vercel/elide"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "server.js"
    }
  ]
}
```

#### DigitalOcean App Platform

**app.yaml**:
```yaml
name: ghost-clone
services:
- name: web
  github:
    repo: your-username/ghost-clone
    branch: main
  build_command: npm install && cd admin && npm install && npm run build
  run_command: elide run server.js
  environment_slug: elide
  envs:
  - key: NODE_ENV
    value: "production"
  - key: JWT_SECRET
    type: SECRET
  http_port: 3000
databases:
- name: ghost-db
  engine: PG
```

## Reverse Proxy (nginx)

### Basic Configuration

**/etc/nginx/sites-available/ghost-clone**:
```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Static files
    location /assets {
        alias /opt/ghost-clone/public/assets;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    location /content/images {
        alias /opt/ghost-clone/content/images;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}
```

### SSL with Let's Encrypt

```bash
# Install certbot
sudo apt-get install certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Auto-renewal
sudo certbot renew --dry-run
```

### Advanced nginx Configuration

```nginx
# Rate limiting
limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
limit_req_zone $binary_remote_addr zone=admin:10m rate=5r/s;

# Caching
proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=ghost_cache:10m max_size=1g inactive=60m;

server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/json;

    # Admin API rate limiting
    location /api/admin {
        limit_req zone=admin burst=20 nodelay;
        proxy_pass http://localhost:3000;
    }

    # Public API rate limiting
    location /api {
        limit_req zone=api burst=50 nodelay;
        proxy_pass http://localhost:3000;
    }

    # Cached content
    location / {
        proxy_cache ghost_cache;
        proxy_cache_valid 200 10m;
        proxy_cache_use_stale error timeout updating http_500 http_502 http_503 http_504;
        proxy_cache_background_update on;
        add_header X-Cache-Status $upstream_cache_status;

        proxy_pass http://localhost:3000;
    }
}
```

## Database Management

### Backup Strategy

**Automated daily backups**:
```bash
#!/bin/bash
# /usr/local/bin/backup-ghost.sh

BACKUP_DIR="/var/backups/ghost-clone"
DATE=$(date +%Y%m%d_%H%M%S)
DB_PATH="/var/lib/ghost-clone/ghost.db"

mkdir -p $BACKUP_DIR

# Backup database
cp $DB_PATH "$BACKUP_DIR/ghost_$DATE.db"

# Backup content
tar -czf "$BACKUP_DIR/content_$DATE.tar.gz" /var/lib/ghost-clone/content

# Keep only last 30 days
find $BACKUP_DIR -name "ghost_*.db" -mtime +30 -delete
find $BACKUP_DIR -name "content_*.tar.gz" -mtime +30 -delete
```

**Cron job** (daily at 2 AM):
```bash
0 2 * * * /usr/local/bin/backup-ghost.sh
```

### Remote Backups

**Upload to S3**:
```bash
#!/bin/bash
aws s3 sync /var/backups/ghost-clone s3://my-bucket/ghost-backups/
```

## CDN Configuration

### Cloudflare

1. Point domain to Cloudflare DNS
2. Enable "Always Use HTTPS"
3. Set cache level to "Standard"
4. Create page rule for static assets:
   - URL: `yourdomain.com/content/images/*`
   - Cache Level: Cache Everything
   - Edge Cache TTL: 1 month

### AWS CloudFront

```javascript
// In config/production.json
{
  "cdn": {
    "enabled": true,
    "url": "https://d1234abcd.cloudfront.net"
  }
}
```

## Monitoring

### Application Monitoring

**Using PM2**:
```bash
pm2 monitor
```

**Using Prometheus + Grafana**:
```javascript
// Add to server.js
import { collectDefaultMetrics, register } from 'prom-client';

collectDefaultMetrics();

server.get('/metrics', async (req, res) => {
  res.setHeader('Content-Type', register.contentType);
  res.send(await register.metrics());
});
```

### Log Management

**Structured logging**:
```javascript
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});
```

**Log rotation**:
```bash
# /etc/logrotate.d/ghost-clone
/var/log/ghost-clone/*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 ghost ghost
    sharedscripts
}
```

## Performance Optimization

### Enable Caching

```javascript
// config/production.json
{
  "cache": {
    "enabled": true,
    "ttl": 300,
    "maxSize": 100
  }
}
```

### Image Optimization

Ensure Python + Pillow is installed for automatic image optimization.

### Database Optimization

```sql
-- Run periodically
VACUUM;
ANALYZE;
REINDEX;
```

## Security Hardening

### Firewall (ufw)

```bash
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

### Fail2ban

```ini
# /etc/fail2ban/jail.local
[ghost-clone]
enabled = true
port = 80,443
filter = ghost-clone
logpath = /var/log/nginx/access.log
maxretry = 5
bantime = 3600
```

### Security Headers

See nginx configuration above for security headers.

## Troubleshooting

### Check Logs

```bash
# Application logs
pm2 logs ghost-clone

# Nginx logs
tail -f /var/log/nginx/error.log
tail -f /var/log/nginx/access.log

# System logs
journalctl -u ghost-clone -f
```

### Database Issues

```bash
# Check integrity
sqlite3 ghost.db "PRAGMA integrity_check;"

# Repair if needed
sqlite3 ghost.db "PRAGMA quick_check;"
```

### Performance Issues

```bash
# Check resource usage
htop

# Check disk space
df -h

# Check database size
du -sh data/ghost.db
```

## Maintenance

### Update Application

```bash
git pull origin main
npm install
npm run migrate
pm2 restart ghost-clone
```

### Update Dependencies

```bash
npm update
npm audit fix
```

### Database Maintenance

```bash
# Monthly cleanup
npm run cleanup
```

## Support

- Documentation: https://docs.ghostclone.dev
- Community: https://community.ghostclone.dev
- Issues: https://github.com/elide/ghost-clone/issues
