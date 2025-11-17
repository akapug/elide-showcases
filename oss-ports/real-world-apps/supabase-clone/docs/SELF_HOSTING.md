# Self-Hosting Guide

Complete guide to self-hosting Elidebase.

## Table of Contents

- [Introduction](#introduction)
- [Requirements](#requirements)
- [Docker Deployment](#docker-deployment)
- [Kubernetes Deployment](#kubernetes-deployment)
- [Cloud Providers](#cloud-providers)
- [Configuration](#configuration)
- [Backup & Recovery](#backup--recovery)
- [Monitoring](#monitoring)
- [Security](#security)
- [Troubleshooting](#troubleshooting)

## Introduction

Elidebase is designed to be easy to self-host on your own infrastructure. This guide covers various deployment options from simple Docker setups to production Kubernetes clusters.

## Requirements

### Minimum Requirements

- **CPU**: 2 cores
- **RAM**: 4 GB
- **Storage**: 20 GB
- **Database**: PostgreSQL 14+
- **Runtime**: Java 21+

### Recommended for Production

- **CPU**: 4-8 cores
- **RAM**: 16 GB
- **Storage**: 100 GB SSD
- **Database**: PostgreSQL 16 with replication
- **Runtime**: Java 21+
- **Load Balancer**: Nginx or HAProxy
- **CDN**: CloudFlare or AWS CloudFront

## Docker Deployment

### Simple Docker Setup

**1. Create docker-compose.yml:**

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:16
    environment:
      POSTGRES_DB: elidebase
      POSTGRES_USER: elidebase
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres-data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U elidebase"]
      interval: 10s
      timeout: 5s
      retries: 5

  elidebase:
    image: elidebase/elidebase:latest
    depends_on:
      postgres:
        condition: service_healthy
    environment:
      DATABASE_URL: postgresql://elidebase:${DB_PASSWORD}@postgres:5432/elidebase
      JWT_SECRET: ${JWT_SECRET}
      PORT: 8000
    ports:
      - "8000:8000"
    volumes:
      - ./storage:/app/storage
      - ./functions:/app/functions
    restart: unless-stopped

volumes:
  postgres-data:
```

**2. Create .env file:**

```bash
DB_PASSWORD=change-this-password
JWT_SECRET=change-this-secret-key-min-32-characters
```

**3. Start services:**

```bash
docker-compose up -d
```

**4. Run migrations:**

```bash
docker-compose exec elidebase elidebase migrate up
```

**5. Access Elidebase:**

```
http://localhost:8000
```

### Production Docker Setup

```yaml
version: '3.8'

services:
  # PostgreSQL with replication
  postgres-primary:
    image: postgres:16
    environment:
      POSTGRES_DB: elidebase
      POSTGRES_USER: elidebase
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_REPLICATION_MODE: master
      POSTGRES_REPLICATION_USER: replicator
      POSTGRES_REPLICATION_PASSWORD: ${REPLICATION_PASSWORD}
    volumes:
      - postgres-primary-data:/var/lib/postgresql/data
    networks:
      - elidebase-network

  postgres-replica:
    image: postgres:16
    environment:
      POSTGRES_MASTER_SERVICE: postgres-primary
      POSTGRES_REPLICATION_MODE: slave
      POSTGRES_REPLICATION_USER: replicator
      POSTGRES_REPLICATION_PASSWORD: ${REPLICATION_PASSWORD}
    volumes:
      - postgres-replica-data:/var/lib/postgresql/data
    networks:
      - elidebase-network

  # Redis for caching
  redis:
    image: redis:7-alpine
    command: redis-server --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis-data:/data
    networks:
      - elidebase-network

  # Elidebase instances (scale as needed)
  elidebase:
    image: elidebase/elidebase:latest
    deploy:
      replicas: 3
      restart_policy:
        condition: on-failure
      resources:
        limits:
          cpus: '2'
          memory: 4G
        reservations:
          cpus: '1'
          memory: 2G
    environment:
      DATABASE_URL: postgresql://elidebase:${DB_PASSWORD}@postgres-primary:5432/elidebase
      REDIS_URL: redis://:${REDIS_PASSWORD}@redis:6379
      JWT_SECRET: ${JWT_SECRET}
      NODE_ENV: production
    volumes:
      - shared-storage:/app/storage
      - ./functions:/app/functions
    networks:
      - elidebase-network
    depends_on:
      - postgres-primary
      - redis

  # Nginx load balancer
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
    networks:
      - elidebase-network
    depends_on:
      - elidebase

volumes:
  postgres-primary-data:
  postgres-replica-data:
  redis-data:
  shared-storage:

networks:
  elidebase-network:
    driver: bridge
```

**nginx.conf:**

```nginx
events {
    worker_connections 1024;
}

http {
    upstream elidebase {
        least_conn;
        server elidebase:8000 max_fails=3 fail_timeout=30s;
    }

    server {
        listen 80;
        server_name yourapp.com;

        # Redirect to HTTPS
        return 301 https://$server_name$request_uri;
    }

    server {
        listen 443 ssl http2;
        server_name yourapp.com;

        ssl_certificate /etc/nginx/ssl/cert.pem;
        ssl_certificate_key /etc/nginx/ssl/key.pem;

        # Security headers
        add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;

        # Rate limiting
        limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;

        location / {
            limit_req zone=api burst=20 nodelay;

            proxy_pass http://elidebase;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
        }

        # WebSocket support
        location /realtime {
            proxy_pass http://elidebase;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
            proxy_set_header Host $host;
            proxy_read_timeout 86400;
        }

        # Static file caching
        location ~* \.(jpg|jpeg|png|gif|ico|css|js)$ {
            proxy_pass http://elidebase;
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
}
```

## Kubernetes Deployment

### Basic Kubernetes Setup

**1. Create namespace:**

```yaml
# namespace.yaml
apiVersion: v1
kind: Namespace
metadata:
  name: elidebase
```

**2. PostgreSQL StatefulSet:**

```yaml
# postgres.yaml
apiVersion: v1
kind: Secret
metadata:
  name: postgres-secret
  namespace: elidebase
type: Opaque
data:
  password: <base64-encoded-password>
---
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: postgres-pvc
  namespace: elidebase
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 100Gi
  storageClassName: fast-ssd
---
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: postgres
  namespace: elidebase
spec:
  serviceName: postgres
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
        image: postgres:16
        env:
        - name: POSTGRES_DB
          value: elidebase
        - name: POSTGRES_USER
          value: elidebase
        - name: POSTGRES_PASSWORD
          valueFrom:
            secretKeyRef:
              name: postgres-secret
              key: password
        ports:
        - containerPort: 5432
          name: postgres
        volumeMounts:
        - name: postgres-data
          mountPath: /var/lib/postgresql/data
        resources:
          requests:
            memory: "4Gi"
            cpu: "2"
          limits:
            memory: "8Gi"
            cpu: "4"
  volumeClaimTemplates:
  - metadata:
      name: postgres-data
    spec:
      accessModes: [ "ReadWriteOnce" ]
      storageClassName: fast-ssd
      resources:
        requests:
          storage: 100Gi
---
apiVersion: v1
kind: Service
metadata:
  name: postgres
  namespace: elidebase
spec:
  ports:
  - port: 5432
  selector:
    app: postgres
  clusterIP: None
```

**3. Elidebase Deployment:**

```yaml
# elidebase.yaml
apiVersion: v1
kind: Secret
metadata:
  name: elidebase-secrets
  namespace: elidebase
type: Opaque
data:
  jwt-secret: <base64-encoded-jwt-secret>
  database-password: <base64-encoded-db-password>
---
apiVersion: v1
kind: ConfigMap
metadata:
  name: elidebase-config
  namespace: elidebase
data:
  DATABASE_HOST: postgres
  DATABASE_PORT: "5432"
  DATABASE_NAME: elidebase
  DATABASE_USER: elidebase
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: elidebase
  namespace: elidebase
spec:
  replicas: 3
  selector:
    matchLabels:
      app: elidebase
  template:
    metadata:
      labels:
        app: elidebase
    spec:
      containers:
      - name: elidebase
        image: elidebase/elidebase:latest
        ports:
        - containerPort: 8000
          name: http
        env:
        - name: DATABASE_URL
          value: postgresql://$(DATABASE_USER):$(DATABASE_PASSWORD)@$(DATABASE_HOST):$(DATABASE_PORT)/$(DATABASE_NAME)
        - name: DATABASE_PASSWORD
          valueFrom:
            secretKeyRef:
              name: elidebase-secrets
              key: database-password
        - name: JWT_SECRET
          valueFrom:
            secretKeyRef:
              name: elidebase-secrets
              key: jwt-secret
        envFrom:
        - configMapRef:
            name: elidebase-config
        resources:
          requests:
            memory: "2Gi"
            cpu: "1"
          limits:
            memory: "4Gi"
            cpu: "2"
        livenessProbe:
          httpGet:
            path: /health
            port: 8000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 8000
          initialDelaySeconds: 10
          periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: elidebase
  namespace: elidebase
spec:
  type: LoadBalancer
  ports:
  - port: 80
    targetPort: 8000
    protocol: TCP
    name: http
  selector:
    app: elidebase
```

**4. Ingress (Optional):**

```yaml
# ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: elidebase-ingress
  namespace: elidebase
  annotations:
    kubernetes.io/ingress.class: nginx
    cert-manager.io/cluster-issuer: letsencrypt-prod
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
    nginx.ingress.kubernetes.io/rate-limit: "100"
spec:
  tls:
  - hosts:
    - yourapp.com
    secretName: elidebase-tls
  rules:
  - host: yourapp.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: elidebase
            port:
              number: 80
```

**5. Deploy to Kubernetes:**

```bash
kubectl apply -f namespace.yaml
kubectl apply -f postgres.yaml
kubectl apply -f elidebase.yaml
kubectl apply -f ingress.yaml

# Wait for pods to be ready
kubectl wait --for=condition=ready pod -l app=elidebase -n elidebase --timeout=300s

# Run migrations
kubectl exec -it -n elidebase deployment/elidebase -- elidebase migrate up

# Check status
kubectl get pods -n elidebase
kubectl logs -f -n elidebase deployment/elidebase
```

### Horizontal Pod Autoscaling

```yaml
# hpa.yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: elidebase-hpa
  namespace: elidebase
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: elidebase
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

## Cloud Providers

### AWS (ECS)

**1. Create ECS task definition:**

```json
{
  "family": "elidebase",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "2048",
  "memory": "4096",
  "containerDefinitions": [
    {
      "name": "elidebase",
      "image": "elidebase/elidebase:latest",
      "portMappings": [
        {
          "containerPort": 8000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "NODE_ENV",
          "value": "production"
        }
      ],
      "secrets": [
        {
          "name": "DATABASE_URL",
          "valueFrom": "arn:aws:secretsmanager:region:account:secret:elidebase/database-url"
        },
        {
          "name": "JWT_SECRET",
          "valueFrom": "arn:aws:secretsmanager:region:account:secret:elidebase/jwt-secret"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/elidebase",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}
```

**2. Use RDS for PostgreSQL:**

```bash
aws rds create-db-instance \
  --db-instance-identifier elidebase-db \
  --db-instance-class db.t3.medium \
  --engine postgres \
  --engine-version 16.1 \
  --master-username elidebase \
  --master-user-password ${DB_PASSWORD} \
  --allocated-storage 100 \
  --storage-type gp3 \
  --backup-retention-period 7 \
  --multi-az
```

### Google Cloud (Cloud Run)

**1. Build and push Docker image:**

```bash
# Build image
docker build -t gcr.io/${PROJECT_ID}/elidebase:latest .

# Push to Container Registry
docker push gcr.io/${PROJECT_ID}/elidebase:latest
```

**2. Deploy to Cloud Run:**

```bash
gcloud run deploy elidebase \
  --image gcr.io/${PROJECT_ID}/elidebase:latest \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars DATABASE_URL=${DATABASE_URL} \
  --set-secrets JWT_SECRET=jwt-secret:latest \
  --min-instances 1 \
  --max-instances 10 \
  --cpu 2 \
  --memory 4Gi
```

**3. Use Cloud SQL:**

```bash
gcloud sql instances create elidebase-db \
  --database-version POSTGRES_16 \
  --tier db-custom-2-7680 \
  --region us-central1 \
  --backup \
  --backup-start-time 03:00
```

### Azure (Container Instances)

```bash
# Create resource group
az group create --name elidebase-rg --location eastus

# Create PostgreSQL server
az postgres flexible-server create \
  --name elidebase-db \
  --resource-group elidebase-rg \
  --location eastus \
  --admin-user elidebase \
  --admin-password ${DB_PASSWORD} \
  --sku-name Standard_D2s_v3 \
  --version 16

# Deploy container
az container create \
  --resource-group elidebase-rg \
  --name elidebase \
  --image elidebase/elidebase:latest \
  --cpu 2 \
  --memory 4 \
  --ports 8000 \
  --environment-variables \
    DATABASE_URL=${DATABASE_URL} \
  --secure-environment-variables \
    JWT_SECRET=${JWT_SECRET}
```

## Configuration

### Environment Variables

```bash
# Database
DATABASE_URL=postgresql://user:password@host:5432/database
DATABASE_POOL_SIZE=20
DATABASE_MAX_LIFETIME=1800000
DATABASE_CONNECTION_TIMEOUT=30000
DATABASE_SSL=true

# Server
PORT=8000
HOST=0.0.0.0
NODE_ENV=production

# Authentication
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRY=3600
REFRESH_TOKEN_EXPIRY=2592000

# Storage
STORAGE_ROOT=/app/storage
STORAGE_MAX_FILE_SIZE=52428800

# Functions
FUNCTIONS_ROOT=/app/functions
FUNCTIONS_TIMEOUT=30000

# Real-time
REALTIME_ENABLED=true
REALTIME_MAX_CONNECTIONS=1000

# Redis (optional)
REDIS_URL=redis://localhost:6379

# Email (optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=noreply@yourapp.com

# Monitoring
SENTRY_DSN=https://your-sentry-dsn
LOG_LEVEL=info
```

### Configuration File

```json
{
  "database": {
    "url": "postgresql://user:password@host:5432/database",
    "poolSize": 20,
    "ssl": true
  },
  "server": {
    "port": 8000,
    "host": "0.0.0.0"
  },
  "auth": {
    "jwtSecret": "your-secret-key",
    "jwtExpiry": 3600,
    "refreshTokenExpiry": 2592000,
    "providers": {
      "google": {
        "clientId": "your-client-id",
        "clientSecret": "your-client-secret"
      }
    }
  },
  "storage": {
    "root": "/app/storage",
    "maxFileSize": 52428800
  },
  "functions": {
    "root": "/app/functions",
    "timeout": 30000
  },
  "realtime": {
    "enabled": true,
    "maxConnections": 1000
  }
}
```

## Backup & Recovery

### Database Backups

**Automated backups with pg_dump:**

```bash
#!/bin/bash
# backup.sh

BACKUP_DIR="/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/elidebase_$TIMESTAMP.sql.gz"

# Create backup
pg_dump -h localhost -U elidebase elidebase | gzip > $BACKUP_FILE

# Upload to S3
aws s3 cp $BACKUP_FILE s3://your-bucket/backups/

# Cleanup old backups (keep last 30 days)
find $BACKUP_DIR -name "elidebase_*.sql.gz" -mtime +30 -delete

echo "Backup completed: $BACKUP_FILE"
```

**Schedule with cron:**

```bash
# Add to crontab
0 2 * * * /path/to/backup.sh
```

### Restore from Backup

```bash
#!/bin/bash
# restore.sh

BACKUP_FILE=$1

# Download from S3
aws s3 cp s3://your-bucket/backups/$BACKUP_FILE /tmp/backup.sql.gz

# Restore
gunzip -c /tmp/backup.sql.gz | psql -h localhost -U elidebase elidebase

echo "Restore completed from: $BACKUP_FILE"
```

### Continuous Backup with WAL-G

```bash
# Install WAL-G
wget https://github.com/wal-g/wal-g/releases/download/v2.0.1/wal-g-pg-ubuntu-20.04-amd64.tar.gz
tar -xf wal-g-pg-ubuntu-20.04-amd64.tar.gz
mv wal-g-pg-ubuntu-20.04-amd64 /usr/local/bin/wal-g

# Configure PostgreSQL
# Add to postgresql.conf:
archive_mode = on
archive_command = 'wal-g wal-push %p'
restore_command = 'wal-g wal-fetch %f %p'

# Set environment variables
export WALG_S3_PREFIX=s3://your-bucket/wal-g
export AWS_REGION=us-east-1

# Create base backup
wal-g backup-push /var/lib/postgresql/data
```

## Monitoring

### Prometheus & Grafana

**1. Prometheus configuration:**

```yaml
# prometheus.yml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'elidebase'
    static_configs:
      - targets: ['elidebase:8000']
    metrics_path: '/metrics'
```

**2. Deploy with Docker:**

```yaml
# Add to docker-compose.yml
  prometheus:
    image: prom/prometheus
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus-data:/prometheus
    ports:
      - "9090:9090"

  grafana:
    image: grafana/grafana
    ports:
      - "3000:3000"
    volumes:
      - grafana-data:/var/lib/grafana
```

### Health Checks

```kotlin
// Add to your Elidebase server
get("/health") {
    val dbHealthy = dbManager.testConnection()
    val storageHealthy = File(storageRoot).exists()

    val status = if (dbHealthy && storageHealthy) "healthy" else "unhealthy"
    val statusCode = if (dbHealthy && storageHealthy) HttpStatusCode.OK else HttpStatusCode.ServiceUnavailable

    call.respond(statusCode, mapOf(
        "status" to status,
        "database" to dbHealthy,
        "storage" to storageHealthy,
        "timestamp" to Instant.now().toString()
    ))
}

get("/metrics") {
    // Prometheus metrics
    val metrics = buildString {
        append("# HELP elidebase_requests_total Total requests\n")
        append("# TYPE elidebase_requests_total counter\n")
        append("elidebase_requests_total ${requestCounter}\n")

        append("# HELP elidebase_db_connections Database connections\n")
        append("# TYPE elidebase_db_connections gauge\n")
        append("elidebase_db_connections ${dbManager.getPoolStats()["active"]}\n")
    }

    call.respondText(metrics, ContentType.Text.Plain)
}
```

## Security

### SSL/TLS Configuration

```bash
# Generate Let's Encrypt certificates
certbot certonly --standalone -d yourapp.com -d www.yourapp.com

# Auto-renew
certbot renew --dry-run
```

### Firewall Rules

```bash
# UFW (Ubuntu)
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS
ufw deny 8000/tcp   # Block direct access to Elidebase
ufw enable
```

### Security Headers

```nginx
# Add to nginx.conf
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Content-Security-Policy "default-src 'self'" always;
```

## Troubleshooting

### Common Issues

**Database connection errors:**

```bash
# Check PostgreSQL is running
docker ps | grep postgres

# Check connectivity
psql -h localhost -U elidebase -d elidebase

# Check logs
docker logs postgres
```

**Out of memory:**

```bash
# Increase container memory
docker-compose up -d --scale elidebase=1 --memory 8g

# Check memory usage
docker stats
```

**Slow queries:**

```sql
-- Enable slow query logging
ALTER SYSTEM SET log_min_duration_statement = 1000;

-- Check slow queries
SELECT query, calls, total_time, mean_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;
```

## Next Steps

- [Database Guide](DATABASE_GUIDE.md)
- [Authentication Guide](AUTH_GUIDE.md)
- [Storage Guide](STORAGE_GUIDE.md)
- [Functions Guide](FUNCTIONS_GUIDE.md)
