# Deployment Guide

Complete guide to deploying Elide CMS to production.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Configuration](#environment-configuration)
3. [Database Setup](#database-setup)
4. [Docker Deployment](#docker-deployment)
5. [Cloud Platforms](#cloud-platforms)
6. [SSL/HTTPS](#ssl-https)
7. [Performance Optimization](#performance-optimization)
8. [Monitoring](#monitoring)
9. [Backup & Recovery](#backup--recovery)

## Prerequisites

- Node.js 18+ or Elide runtime
- Database (PostgreSQL, MySQL, or SQLite)
- Domain name (for production)
- SSL certificate (recommended)

## Environment Configuration

### Production Environment Variables

Create a `.env` file:

```bash
# Environment
NODE_ENV=production

# Server
PORT=1337
HOST=0.0.0.0

# Database
DATABASE_CLIENT=postgres
DATABASE_HOST=your-db-host.com
DATABASE_PORT=5432
DATABASE_NAME=cms_production
DATABASE_USER=cms_user
DATABASE_PASSWORD=your-secure-password
DATABASE_SSL=true

# Security
JWT_SECRET=your-very-long-secret-key-change-this
ADMIN_JWT_SECRET=another-very-long-secret-key
API_TOKEN_SALT=secure-token-salt-change-this

# CORS
CORS_ORIGIN=https://your-frontend.com

# Media
MEDIA_PROVIDER=s3
S3_BUCKET=your-bucket-name
S3_REGION=us-east-1
S3_ACCESS_KEY_ID=your-access-key
S3_SECRET_ACCESS_KEY=your-secret-key

# Email (optional)
EMAIL_PROVIDER=sendgrid
EMAIL_FROM=noreply@yourapp.com
SENDGRID_API_KEY=your-sendgrid-key

# Monitoring (optional)
SENTRY_DSN=your-sentry-dsn
LOG_LEVEL=info
```

### Configuration File

Create `config/production.json`:

```json
{
  "server": {
    "host": "0.0.0.0",
    "port": 1337,
    "ssl": true
  },
  "database": {
    "client": "postgres",
    "connection": {
      "ssl": {
        "rejectUnauthorized": false
      }
    },
    "pool": {
      "min": 2,
      "max": 20
    }
  },
  "cors": {
    "enabled": true,
    "origin": "${CORS_ORIGIN}",
    "credentials": true
  },
  "rateLimit": {
    "enabled": true,
    "max": 1000,
    "windowMs": 60000
  },
  "admin": {
    "serveAdminPanel": true,
    "autoOpen": false
  }
}
```

## Database Setup

### PostgreSQL

1. **Create Database**:
```sql
CREATE DATABASE cms_production;
CREATE USER cms_user WITH ENCRYPTED PASSWORD 'secure-password';
GRANT ALL PRIVILEGES ON DATABASE cms_production TO cms_user;
```

2. **Run Migrations**:
```bash
npm run migrate
```

3. **Create Admin User**:
```bash
npm run create-admin
```

### MySQL

1. **Create Database**:
```sql
CREATE DATABASE cms_production CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'cms_user'@'%' IDENTIFIED BY 'secure-password';
GRANT ALL PRIVILEGES ON cms_production.* TO 'cms_user'@'%';
FLUSH PRIVILEGES;
```

2. **Run Migrations**:
```bash
npm run migrate
```

### Connection Pooling

Configure connection pool based on your traffic:

```json
{
  "database": {
    "pool": {
      "min": 2,
      "max": 20,
      "acquireTimeoutMillis": 30000,
      "idleTimeoutMillis": 30000
    }
  }
}
```

## Docker Deployment

### Dockerfile

```dockerfile
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application code
COPY . .

# Build (if needed)
RUN npm run build

FROM node:18-alpine

WORKDIR /app

# Copy from builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app .

# Create uploads directory
RUN mkdir -p /app/public/uploads

# Expose port
EXPOSE 1337

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s \
  CMD node -e "require('http').get('http://localhost:1337/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start application
CMD ["npm", "start"]
```

### docker-compose.yml

```yaml
version: '3.8'

services:
  cms:
    build: .
    ports:
      - "1337:1337"
    environment:
      NODE_ENV: production
      DATABASE_CLIENT: postgres
      DATABASE_HOST: db
      DATABASE_PORT: 5432
      DATABASE_NAME: cms
      DATABASE_USER: cms_user
      DATABASE_PASSWORD: ${DB_PASSWORD}
      JWT_SECRET: ${JWT_SECRET}
      ADMIN_JWT_SECRET: ${ADMIN_JWT_SECRET}
    depends_on:
      - db
    volumes:
      - uploads:/app/public/uploads
    restart: unless-stopped

  db:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: cms
      POSTGRES_USER: cms_user
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - db_data:/var/lib/postgresql/data
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - cms
    restart: unless-stopped

volumes:
  db_data:
  uploads:
```

### Build and Run

```bash
# Build image
docker build -t elide-cms .

# Run with docker-compose
docker-compose up -d

# View logs
docker-compose logs -f cms

# Stop services
docker-compose down
```

## Cloud Platforms

### AWS (EC2 + RDS)

1. **Launch EC2 Instance**:
   - Choose Ubuntu 22.04 LTS
   - Instance type: t3.medium (or larger)
   - Configure security group (ports 80, 443, 1337)

2. **Setup RDS**:
   - Engine: PostgreSQL 15
   - Instance class: db.t3.small
   - Enable automated backups

3. **Deploy Application**:
```bash
# SSH to EC2
ssh ubuntu@your-instance-ip

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Clone and setup
git clone your-repo
cd elide-cms
npm install
npm run build

# Setup systemd service
sudo nano /etc/systemd/system/elide-cms.service
```

**Service file** (`/etc/systemd/system/elide-cms.service`):
```ini
[Unit]
Description=Elide CMS
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/home/ubuntu/elide-cms
Environment="NODE_ENV=production"
EnvironmentFile=/home/ubuntu/elide-cms/.env
ExecStart=/usr/bin/npm start
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

```bash
# Start service
sudo systemctl enable elide-cms
sudo systemctl start elide-cms
sudo systemctl status elide-cms
```

### Heroku

```bash
# Login
heroku login

# Create app
heroku create your-app-name

# Add PostgreSQL
heroku addons:create heroku-postgresql:hobby-dev

# Set environment variables
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET=your-secret

# Deploy
git push heroku main

# Run migrations
heroku run npm run migrate

# View logs
heroku logs --tail
```

### DigitalOcean App Platform

1. Create `app.yaml`:

```yaml
name: elide-cms
region: nyc
services:
  - name: web
    github:
      repo: your-username/elide-cms
      branch: main
      deploy_on_push: true
    build_command: npm run build
    run_command: npm start
    environment_slug: node-js
    instance_count: 1
    instance_size_slug: basic-xs
    envs:
      - key: NODE_ENV
        value: production
      - key: DATABASE_URL
        value: ${db.DATABASE_URL}
      - key: JWT_SECRET
        value: ${JWT_SECRET}
        type: SECRET
    routes:
      - path: /
databases:
  - name: db
    engine: PG
    version: "15"
    production: true
```

2. Deploy:
```bash
doctl apps create --spec app.yaml
```

### Vercel (Serverless)

**Note**: Serverless deployment requires modifications for database connections.

```json
// vercel.json
{
  "version": 2,
  "builds": [
    {
      "src": "index.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "index.js"
    }
  ],
  "env": {
    "NODE_ENV": "production"
  }
}
```

## SSL/HTTPS

### Nginx Reverse Proxy

`nginx.conf`:

```nginx
upstream cms_backend {
    server cms:1337;
}

server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    client_max_body_size 100M;

    location / {
        proxy_pass http://cms_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    location /uploads {
        alias /app/public/uploads;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

### Let's Encrypt (Certbot)

```bash
# Install certbot
sudo apt-get update
sudo apt-get install certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal
sudo certbot renew --dry-run
```

## Performance Optimization

### 1. Database Optimization

```sql
-- Add indexes
CREATE INDEX idx_articles_published ON ct_article(published_at);
CREATE INDEX idx_articles_author ON ct_article(author_id);
CREATE INDEX idx_users_email ON cms_users(email);

-- Analyze tables
ANALYZE ct_article;
ANALYZE cms_users;
```

### 2. Redis Caching

```javascript
// Add to config
{
  "cache": {
    "enabled": true,
    "provider": "redis",
    "options": {
      "host": "localhost",
      "port": 6379,
      "ttl": 3600
    }
  }
}
```

### 3. CDN for Media

Use CloudFront, Cloudflare, or similar for static assets:

```javascript
{
  "media": {
    "provider": "s3",
    "providerOptions": {
      "cdn": "https://cdn.yourapp.com"
    }
  }
}
```

### 4. Compression

Enable gzip in Nginx:

```nginx
gzip on;
gzip_vary on;
gzip_proxied any;
gzip_comp_level 6;
gzip_types text/plain text/css text/xml text/javascript application/json application/javascript application/xml+rss;
```

## Monitoring

### Application Monitoring

1. **PM2** (Process Manager):
```bash
# Install PM2
npm install -g pm2

# Start application
pm2 start index.js --name elide-cms

# Monitor
pm2 monit

# Setup auto-restart
pm2 startup
pm2 save
```

2. **Health Checks**:
```bash
# Add health check endpoint
curl http://localhost:1337/health
```

3. **Logging**:
```javascript
// Use structured logging
{
  "logging": {
    "level": "info",
    "format": "json",
    "outputs": ["console", "file"],
    "file": {
      "path": "/var/log/elide-cms/app.log",
      "maxSize": "100m",
      "maxFiles": 10
    }
  }
}
```

### External Monitoring

- **Sentry**: Error tracking
- **DataDog**: APM and monitoring
- **New Relic**: Performance monitoring
- **UptimeRobot**: Uptime monitoring

## Backup & Recovery

### Database Backups

**PostgreSQL**:
```bash
# Backup
pg_dump -h localhost -U cms_user cms_production > backup.sql

# Restore
psql -h localhost -U cms_user cms_production < backup.sql

# Automated backup (cron)
0 2 * * * pg_dump -h localhost -U cms_user cms_production | gzip > /backups/cms_$(date +\%Y\%m\%d).sql.gz
```

**MySQL**:
```bash
# Backup
mysqldump -u cms_user -p cms_production > backup.sql

# Restore
mysql -u cms_user -p cms_production < backup.sql
```

### Media Backups

**S3 Sync**:
```bash
# Backup to S3
aws s3 sync /app/public/uploads s3://your-backup-bucket/uploads/

# Restore from S3
aws s3 sync s3://your-backup-bucket/uploads/ /app/public/uploads
```

### Disaster Recovery Plan

1. **Daily automated backups**
2. **Store backups in multiple locations**
3. **Test restoration process regularly**
4. **Document recovery procedures**
5. **Monitor backup success/failure**

## Security Checklist

- [ ] Change default admin credentials
- [ ] Use strong JWT secrets (minimum 32 characters)
- [ ] Enable HTTPS/SSL
- [ ] Configure firewall rules
- [ ] Enable rate limiting
- [ ] Set up CORS properly
- [ ] Keep dependencies updated
- [ ] Use environment variables for secrets
- [ ] Enable database SSL connections
- [ ] Regular security audits
- [ ] Monitor access logs
- [ ] Implement IP whitelisting (if needed)

## Troubleshooting

### Common Issues

1. **Database Connection Fails**:
```bash
# Check connection
psql -h $DATABASE_HOST -U $DATABASE_USER -d $DATABASE_NAME

# Verify credentials
echo $DATABASE_PASSWORD
```

2. **Out of Memory**:
```bash
# Check memory usage
free -h

# Increase Node.js memory
NODE_OPTIONS="--max-old-space-size=4096" npm start
```

3. **Slow Queries**:
```sql
-- Enable query logging
ALTER DATABASE cms_production SET log_min_duration_statement = 1000;

-- View slow queries
SELECT * FROM pg_stat_statements ORDER BY total_time DESC LIMIT 10;
```

4. **Port Already in Use**:
```bash
# Find process
lsof -i :1337

# Kill process
kill -9 <PID>
```

## Scaling

### Horizontal Scaling

1. **Load Balancer** (Nginx):
```nginx
upstream cms_cluster {
    server cms1:1337;
    server cms2:1337;
    server cms3:1337;
}
```

2. **Shared Database**: Use managed database service

3. **Shared Media Storage**: Use S3 or similar

4. **Session Store**: Use Redis for sessions

### Vertical Scaling

- Increase server resources (CPU, RAM)
- Optimize database queries
- Add database read replicas
- Implement caching

---

For more information, see the [README](../README.md) and [Performance Guide](PERFORMANCE.md).
