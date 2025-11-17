# Elide Workflow - Production Deployment Guide

Complete guide for deploying Elide Workflow to production environments.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Infrastructure Options](#infrastructure-options)
- [Database Setup](#database-setup)
- [Application Deployment](#application-deployment)
- [Reverse Proxy Configuration](#reverse-proxy-configuration)
- [SSL/TLS Setup](#ssltls-setup)
- [Environment Variables](#environment-variables)
- [Monitoring & Logging](#monitoring--logging)
- [Backup & Recovery](#backup--recovery)
- [Security Hardening](#security-hardening)
- [Performance Tuning](#performance-tuning)
- [Troubleshooting](#troubleshooting)

## Prerequisites

### System Requirements

**Minimum Requirements:**
- CPU: 2 cores
- RAM: 4 GB
- Disk: 20 GB SSD
- OS: Ubuntu 20.04 LTS or newer

**Recommended for Production:**
- CPU: 4+ cores
- RAM: 8+ GB
- Disk: 100+ GB SSD
- OS: Ubuntu 22.04 LTS

### Software Requirements

- Java 21 or newer
- PostgreSQL 14 or newer
- Node.js 18+ (for editor)
- Nginx or Apache (reverse proxy)
- Docker & Docker Compose (optional)

## Infrastructure Options

### Option 1: Docker Deployment (Recommended)

Docker provides the easiest deployment with all dependencies containerized.

**Step 1: Clone Repository**
```bash
git clone https://github.com/your-org/elide-workflow.git
cd elide-workflow
```

**Step 2: Configure Environment**
```bash
cp .env.example .env
nano .env
```

Update these values:
```env
DB_PASSWORD=your_secure_password_here
ENCRYPTION_KEY=generate_a_long_random_key_here
JWT_SECRET=generate_another_random_key_here
```

**Step 3: Start Services**
```bash
docker-compose up -d
```

**Step 4: Verify Deployment**
```bash
docker-compose ps
docker-compose logs -f workflow
```

Access the application:
- API: http://your-domain:5678/api
- Editor: http://your-domain:3000

### Option 2: Kubernetes Deployment

For high availability and scalability, deploy to Kubernetes.

**Step 1: Create Namespace**
```bash
kubectl create namespace elide-workflow
```

**Step 2: Deploy PostgreSQL**

Create `postgres-deployment.yaml`:
```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: postgres-pvc
  namespace: elide-workflow
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 50Gi
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: postgres
  namespace: elide-workflow
spec:
  replicas: 1
  selector:
    matchLabels:
      app: postgres
  template:
    metadata:
      labels:
        app: postgres
    spec:
      containers:
      - name: postgres
        image: postgres:14
        ports:
        - containerPort: 5432
        env:
        - name: POSTGRES_DB
          value: elide_workflow
        - name: POSTGRES_USER
          value: postgres
        - name: POSTGRES_PASSWORD
          valueFrom:
            secretKeyRef:
              name: postgres-secret
              key: password
        volumeMounts:
        - name: postgres-storage
          mountPath: /var/lib/postgresql/data
      volumes:
      - name: postgres-storage
        persistentVolumeClaim:
          claimName: postgres-pvc
---
apiVersion: v1
kind: Service
metadata:
  name: postgres-service
  namespace: elide-workflow
spec:
  selector:
    app: postgres
  ports:
  - port: 5432
    targetPort: 5432
```

Apply:
```bash
kubectl apply -f postgres-deployment.yaml
```

**Step 3: Deploy Application**

Create `workflow-deployment.yaml`:
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: elide-workflow
  namespace: elide-workflow
spec:
  replicas: 3
  selector:
    matchLabels:
      app: elide-workflow
  template:
    metadata:
      labels:
        app: elide-workflow
    spec:
      containers:
      - name: workflow
        image: your-registry/elide-workflow:latest
        ports:
        - containerPort: 5678
        env:
        - name: DB_HOST
          value: postgres-service
        - name: DB_PORT
          value: "5432"
        - name: DB_NAME
          value: elide_workflow
        - name: DB_USER
          value: postgres
        - name: DB_PASSWORD
          valueFrom:
            secretKeyRef:
              name: postgres-secret
              key: password
        - name: ENCRYPTION_KEY
          valueFrom:
            secretKeyRef:
              name: app-secrets
              key: encryption-key
        - name: JWT_SECRET
          valueFrom:
            secretKeyRef:
              name: app-secrets
              key: jwt-secret
        resources:
          requests:
            memory: "2Gi"
            cpu: "1000m"
          limits:
            memory: "4Gi"
            cpu: "2000m"
        livenessProbe:
          httpGet:
            path: /health
            port: 5678
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 5678
          initialDelaySeconds: 10
          periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: elide-workflow-service
  namespace: elide-workflow
spec:
  type: LoadBalancer
  selector:
    app: elide-workflow
  ports:
  - port: 80
    targetPort: 5678
---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: elide-workflow-hpa
  namespace: elide-workflow
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: elide-workflow
  minReplicas: 3
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
```

Create secrets:
```bash
kubectl create secret generic postgres-secret \
  --from-literal=password='your_secure_password' \
  -n elide-workflow

kubectl create secret generic app-secrets \
  --from-literal=encryption-key='your_encryption_key' \
  --from-literal=jwt-secret='your_jwt_secret' \
  -n elide-workflow
```

Deploy:
```bash
kubectl apply -f workflow-deployment.yaml
```

### Option 3: Traditional Server Deployment

Deploy on a traditional Linux server.

**Step 1: Install Dependencies**
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Java 21
sudo apt install openjdk-21-jdk -y

# Install PostgreSQL
sudo apt install postgresql postgresql-contrib -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install nodejs -y
```

**Step 2: Setup PostgreSQL**
```bash
sudo -u postgres psql

CREATE DATABASE elide_workflow;
CREATE USER workflow_user WITH ENCRYPTED PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE elide_workflow TO workflow_user;
\q
```

**Step 3: Build Application**
```bash
# Clone repository
git clone https://github.com/your-org/elide-workflow.git
cd elide-workflow

# Build backend
./gradlew clean build

# Build frontend
cd editor
npm install
npm run build
cd ..
```

**Step 4: Create Systemd Service**

Create `/etc/systemd/system/elide-workflow.service`:
```ini
[Unit]
Description=Elide Workflow Automation Platform
After=network.target postgresql.service

[Service]
Type=simple
User=workflow
Group=workflow
WorkingDirectory=/opt/elide-workflow
Environment="DB_HOST=localhost"
Environment="DB_PORT=5432"
Environment="DB_NAME=elide_workflow"
Environment="DB_USER=workflow_user"
Environment="DB_PASSWORD=secure_password"
Environment="PORT=5678"
Environment="ENCRYPTION_KEY=your_encryption_key"
Environment="JWT_SECRET=your_jwt_secret"
ExecStart=/usr/bin/java -jar /opt/elide-workflow/build/libs/elide-workflow.jar
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

**Step 5: Start Service**
```bash
# Create user
sudo useradd -r -s /bin/false workflow

# Copy files
sudo mkdir -p /opt/elide-workflow
sudo cp -r * /opt/elide-workflow/
sudo chown -R workflow:workflow /opt/elide-workflow

# Enable and start service
sudo systemctl daemon-reload
sudo systemctl enable elide-workflow
sudo systemctl start elide-workflow

# Check status
sudo systemctl status elide-workflow
```

## Database Setup

### PostgreSQL Configuration

**Optimize for Production**

Edit `/etc/postgresql/14/main/postgresql.conf`:
```conf
# Memory Settings
shared_buffers = 2GB
effective_cache_size = 6GB
maintenance_work_mem = 512MB
work_mem = 32MB

# Connection Settings
max_connections = 100
superuser_reserved_connections = 3

# Write Ahead Log
wal_buffers = 16MB
checkpoint_completion_target = 0.9

# Query Planning
random_page_cost = 1.1
effective_io_concurrency = 200

# Logging
log_min_duration_statement = 1000
log_line_prefix = '%t [%p]: [%l-1] user=%u,db=%d,app=%a,client=%h '
```

Restart PostgreSQL:
```bash
sudo systemctl restart postgresql
```

### Database Backups

**Automated Backups**

Create `/opt/scripts/backup-workflow-db.sh`:
```bash
#!/bin/bash

BACKUP_DIR="/var/backups/elide-workflow"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/elide_workflow_$DATE.sql.gz"

# Create backup directory
mkdir -p $BACKUP_DIR

# Dump database
pg_dump -h localhost -U workflow_user elide_workflow | gzip > $BACKUP_FILE

# Keep only last 30 days
find $BACKUP_DIR -name "*.sql.gz" -mtime +30 -delete

echo "Backup completed: $BACKUP_FILE"
```

Add to crontab:
```bash
# Daily backups at 2 AM
0 2 * * * /opt/scripts/backup-workflow-db.sh
```

## Reverse Proxy Configuration

### Nginx Configuration

Create `/etc/nginx/sites-available/elide-workflow`:
```nginx
upstream workflow_backend {
    server localhost:5678;
    keepalive 64;
}

upstream workflow_editor {
    server localhost:3000;
    keepalive 64;
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name workflow.example.com;

    return 301 https://$server_name$request_uri;
}

# HTTPS Server
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name workflow.example.com;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/workflow.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/workflow.example.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # API Backend
    location /api/ {
        proxy_pass http://workflow_backend/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Webhook Endpoint
    location /webhook/ {
        proxy_pass http://workflow_backend/webhook/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Increase body size for webhooks
        client_max_body_size 10M;
    }

    # WebSocket
    location /ws/ {
        proxy_pass http://workflow_backend/ws/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;

        # WebSocket timeouts
        proxy_connect_timeout 7d;
        proxy_send_timeout 7d;
        proxy_read_timeout 7d;
    }

    # Editor Frontend
    location / {
        proxy_pass http://workflow_editor/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Static files caching
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
        proxy_pass http://workflow_editor;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

Enable site:
```bash
sudo ln -s /etc/nginx/sites-available/elide-workflow /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## SSL/TLS Setup

### Let's Encrypt (Certbot)

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Obtain certificate
sudo certbot --nginx -d workflow.example.com

# Auto-renewal
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer
```

### Custom SSL Certificate

```bash
# Copy certificates
sudo cp fullchain.pem /etc/ssl/certs/workflow.crt
sudo cp privkey.pem /etc/ssl/private/workflow.key

# Set permissions
sudo chmod 644 /etc/ssl/certs/workflow.crt
sudo chmod 600 /etc/ssl/private/workflow.key
```

## Environment Variables

### Production Environment Configuration

Create `/opt/elide-workflow/.env`:
```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=elide_workflow
DB_USER=workflow_user
DB_PASSWORD=secure_password_here

# Server
HOST=0.0.0.0
PORT=5678

# Security
ENCRYPTION_KEY=generate_with_openssl_rand_base64_32
JWT_SECRET=generate_with_openssl_rand_base64_32
JWT_EXPIRATION=86400

# Logging
LOG_LEVEL=INFO
LOG_FORMAT=JSON

# Performance
THREAD_POOL_SIZE=20
MAX_CONCURRENT_EXECUTIONS=50

# Features
ENABLE_METRICS=true
ENABLE_HEALTH_CHECK=true

# SMTP (for email nodes)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=noreply@example.com
SMTP_PASSWORD=smtp_password_here

# External Services (Optional)
SENTRY_DSN=your_sentry_dsn_here
SLACK_WEBHOOK_URL=your_slack_webhook_here
```

## Monitoring & Logging

### Prometheus Metrics

Add to `WorkflowApplication.kt`:
```kotlin
// Expose metrics endpoint
routing {
    get("/metrics") {
        call.respondText(
            prometheusRegistry.scrape(),
            ContentType.parse("text/plain; version=0.0.4")
        )
    }
}
```

**Prometheus Configuration**

Create `prometheus.yml`:
```yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'elide-workflow'
    static_configs:
      - targets: ['localhost:5678']
    metrics_path: '/metrics'
```

### Grafana Dashboard

Import dashboard JSON for Elide Workflow monitoring.

### Centralized Logging

**ELK Stack Configuration**

**Filebeat** (`/etc/filebeat/filebeat.yml`):
```yaml
filebeat.inputs:
  - type: log
    enabled: true
    paths:
      - /var/log/elide-workflow/*.log
    json.keys_under_root: true
    json.add_error_key: true

output.elasticsearch:
  hosts: ["localhost:9200"]
  index: "elide-workflow-%{+yyyy.MM.dd}"

setup.ilm.enabled: false
```

## Backup & Recovery

### Full System Backup

```bash
#!/bin/bash
# /opt/scripts/full-backup.sh

BACKUP_DIR="/var/backups/elide-workflow-full"
DATE=$(date +%Y%m%d_%H%M%S)

# Create backup directory
mkdir -p $BACKUP_DIR/$DATE

# Database backup
pg_dump -h localhost -U workflow_user elide_workflow | \
    gzip > $BACKUP_DIR/$DATE/database.sql.gz

# Application data
tar -czf $BACKUP_DIR/$DATE/app-data.tar.gz \
    /opt/elide-workflow/data

# Configuration
tar -czf $BACKUP_DIR/$DATE/config.tar.gz \
    /opt/elide-workflow/.env \
    /etc/nginx/sites-available/elide-workflow

echo "Backup completed: $BACKUP_DIR/$DATE"
```

### Disaster Recovery

**Restore from Backup:**
```bash
# Stop services
sudo systemctl stop elide-workflow nginx

# Restore database
gunzip < database.sql.gz | \
    psql -h localhost -U workflow_user elide_workflow

# Restore application data
tar -xzf app-data.tar.gz -C /

# Restore configuration
tar -xzf config.tar.gz -C /

# Start services
sudo systemctl start elide-workflow nginx
```

## Security Hardening

### Firewall Configuration

```bash
# Allow SSH
sudo ufw allow 22/tcp

# Allow HTTP/HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Enable firewall
sudo ufw enable
```

### Database Security

```bash
# Edit PostgreSQL access
sudo nano /etc/postgresql/14/main/pg_hba.conf
```

Only allow localhost:
```
# TYPE  DATABASE        USER            ADDRESS                 METHOD
local   all             postgres                                peer
local   all             all                                     peer
host    all             all             127.0.0.1/32            scrypt
host    all             all             ::1/128                 scrypt
```

### Application Security

1. **Enable HTTPS only**
2. **Use strong encryption keys**
3. **Implement rate limiting**
4. **Regular security updates**
5. **Audit logs regularly**

## Performance Tuning

### JVM Tuning

Update systemd service:
```ini
ExecStart=/usr/bin/java \
    -Xms2g \
    -Xmx4g \
    -XX:+UseG1GC \
    -XX:MaxGCPauseMillis=200 \
    -XX:+UseStringDeduplication \
    -XX:+OptimizeStringConcat \
    -Djava.security.egd=file:/dev/./urandom \
    -jar /opt/elide-workflow/build/libs/elide-workflow.jar
```

### Database Connection Pooling

Configure HikariCP in `application.conf`:
```conf
database {
    maxPoolSize = 20
    minIdle = 5
    connectionTimeout = 30000
    idleTimeout = 600000
    maxLifetime = 1800000
}
```

## Troubleshooting

### Common Issues

**Issue: High memory usage**
```bash
# Check Java heap
jmap -heap <pid>

# Analyze heap dump
jmap -dump:format=b,file=heap.bin <pid>
```

**Issue: Database connection errors**
```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# View PostgreSQL logs
sudo tail -f /var/log/postgresql/postgresql-14-main.log

# Test connection
psql -h localhost -U workflow_user -d elide_workflow
```

**Issue: Slow workflow execution**
```bash
# Check database performance
SELECT * FROM pg_stat_activity WHERE state = 'active';

# Analyze slow queries
SELECT * FROM pg_stat_statements ORDER BY mean_time DESC LIMIT 10;
```

### Debug Mode

Enable debug logging:
```env
LOG_LEVEL=DEBUG
```

View logs:
```bash
sudo journalctl -u elide-workflow -f
```

---

For more information, see:
- [README.md](README.md) - Main documentation
- [API_DOCUMENTATION.md](API_DOCUMENTATION.md) - API reference
- [EXAMPLES.md](EXAMPLES.md) - Workflow examples
