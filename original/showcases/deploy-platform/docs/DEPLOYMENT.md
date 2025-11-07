# Deploy Platform - Self-Hosting Guide

Complete guide for self-hosting the Deploy Platform.

## Table of Contents

- [Requirements](#requirements)
- [Quick Start](#quick-start)
- [Docker Deployment](#docker-deployment)
- [Kubernetes Deployment](#kubernetes-deployment)
- [AWS Deployment](#aws-deployment)
- [GCP Deployment](#gcp-deployment)
- [Azure Deployment](#azure-deployment)
- [Configuration](#configuration)
- [Security](#security)
- [Monitoring](#monitoring)
- [Backup & Recovery](#backup--recovery)
- [Troubleshooting](#troubleshooting)

## Requirements

### Minimum Requirements

- **CPU**: 2 cores
- **RAM**: 4 GB
- **Storage**: 50 GB
- **OS**: Linux (Ubuntu 20.04+, Debian 11+, RHEL 8+)
- **Node.js**: 18.0 or higher
- **Database**: PostgreSQL 13+ or SQLite
- **Storage**: Local filesystem or S3-compatible storage

### Recommended Requirements

- **CPU**: 4+ cores
- **RAM**: 8+ GB
- **Storage**: 100+ GB SSD
- **Database**: PostgreSQL 14+ with replication
- **Storage**: S3-compatible object storage
- **CDN**: CloudFlare or similar

## Quick Start

### Local Development

```bash
# Clone repository
git clone https://github.com/elide-dev/elide-showcases
cd elide-showcases/showcases/deploy-platform

# Install dependencies
npm install

# Configure environment
cp .env.example .env
nano .env

# Start platform
npm run dev
```

### Environment Variables

```bash
# .env
PORT=3000
HOST=0.0.0.0

# Database
DB_TYPE=postgres
DB_HOST=localhost
DB_PORT=5432
DB_NAME=deploy_platform
DB_USERNAME=deploy
DB_PASSWORD=secret

# Storage
STORAGE_BACKEND=s3
STORAGE_BUCKET=deployments
STORAGE_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key

# Build
BUILD_CONCURRENCY=5
CACHE_DIR=/var/cache/deploy-platform
BUILD_DIR=/var/builds

# Runtime
MIN_INSTANCES=1
MAX_INSTANCES=10
AUTO_SCALING=true

# SSL
ENABLE_SSL=true
SSL_PROVIDER=letsencrypt
LETSENCRYPT_EMAIL=admin@example.com

# Monitoring
ENABLE_METRICS=true
METRICS_PORT=9090
```

## Docker Deployment

### Using Docker Compose

Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  api:
    image: deploy-platform:latest
    ports:
      - "3000:3000"
    environment:
      - DB_TYPE=postgres
      - DB_HOST=postgres
      - DB_PORT=5432
      - DB_NAME=deploy_platform
      - DB_USERNAME=deploy
      - DB_PASSWORD=secret
      - STORAGE_BACKEND=s3
      - STORAGE_BUCKET=deployments
    depends_on:
      - postgres
      - redis
    volumes:
      - builds:/var/builds
      - cache:/var/cache
    restart: unless-stopped

  postgres:
    image: postgres:14-alpine
    environment:
      - POSTGRES_DB=deploy_platform
      - POSTGRES_USER=deploy
      - POSTGRES_PASSWORD=secret
    volumes:
      - postgres-data:/var/lib/postgresql/data
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    volumes:
      - redis-data:/data
    restart: unless-stopped

  builder:
    image: deploy-platform:latest
    command: npm run start:builder
    environment:
      - DB_TYPE=postgres
      - DB_HOST=postgres
      - BUILD_CONCURRENCY=5
    depends_on:
      - postgres
      - redis
    volumes:
      - builds:/var/builds
      - cache:/var/cache
    restart: unless-stopped

volumes:
  postgres-data:
  redis-data:
  builds:
  cache:
```

Start services:

```bash
docker-compose up -d
```

### Building Docker Image

Create `Dockerfile`:

```dockerfile
FROM node:18-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --production

# Copy source
COPY . .

# Build
RUN npm run build

FROM node:18-alpine

WORKDIR /app

# Copy built files
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

# Create directories
RUN mkdir -p /var/builds /var/cache

# Expose port
EXPOSE 3000

# Start
CMD ["npm", "start"]
```

Build and run:

```bash
# Build image
docker build -t deploy-platform:latest .

# Run container
docker run -d \
  -p 3000:3000 \
  -e DB_TYPE=postgres \
  -e DB_HOST=postgres \
  -v /var/builds:/var/builds \
  -v /var/cache:/var/cache \
  deploy-platform:latest
```

## Kubernetes Deployment

### Using Helm Chart

Create `values.yaml`:

```yaml
replicaCount: 3

image:
  repository: deploy-platform
  tag: latest
  pullPolicy: IfNotPresent

service:
  type: LoadBalancer
  port: 80
  targetPort: 3000

ingress:
  enabled: true
  className: nginx
  annotations:
    cert-manager.io/cluster-issuer: letsencrypt-prod
  hosts:
    - host: deploy.example.com
      paths:
        - path: /
          pathType: Prefix
  tls:
    - secretName: deploy-platform-tls
      hosts:
        - deploy.example.com

database:
  type: postgres
  host: postgres-service
  port: 5432
  name: deploy_platform
  username: deploy
  passwordSecret: deploy-platform-db-password

storage:
  backend: s3
  bucket: deployments
  region: us-east-1
  credentialsSecret: deploy-platform-s3-credentials

autoscaling:
  enabled: true
  minReplicas: 3
  maxReplicas: 10
  targetCPUUtilizationPercentage: 70
  targetMemoryUtilizationPercentage: 80

resources:
  limits:
    cpu: 1000m
    memory: 2Gi
  requests:
    cpu: 500m
    memory: 1Gi
```

Deploy:

```bash
# Add Helm repository
helm repo add deploy-platform https://charts.deploy-platform.io

# Install chart
helm install deploy-platform deploy-platform/deploy-platform \
  -f values.yaml \
  --namespace deploy-platform \
  --create-namespace
```

### Manual Kubernetes Deployment

Create deployment manifests:

**deployment.yaml**:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: deploy-platform
  namespace: deploy-platform
spec:
  replicas: 3
  selector:
    matchLabels:
      app: deploy-platform
  template:
    metadata:
      labels:
        app: deploy-platform
    spec:
      containers:
      - name: api
        image: deploy-platform:latest
        ports:
        - containerPort: 3000
        env:
        - name: DB_TYPE
          value: postgres
        - name: DB_HOST
          value: postgres-service
        - name: DB_PORT
          value: "5432"
        - name: DB_NAME
          value: deploy_platform
        - name: DB_USERNAME
          valueFrom:
            secretKeyRef:
              name: deploy-platform-secrets
              key: db-username
        - name: DB_PASSWORD
          valueFrom:
            secretKeyRef:
              name: deploy-platform-secrets
              key: db-password
        volumeMounts:
        - name: builds
          mountPath: /var/builds
        - name: cache
          mountPath: /var/cache
        resources:
          limits:
            cpu: 1000m
            memory: 2Gi
          requests:
            cpu: 500m
            memory: 1Gi
      volumes:
      - name: builds
        persistentVolumeClaim:
          claimName: deploy-platform-builds
      - name: cache
        persistentVolumeClaim:
          claimName: deploy-platform-cache
```

**service.yaml**:

```yaml
apiVersion: v1
kind: Service
metadata:
  name: deploy-platform
  namespace: deploy-platform
spec:
  type: LoadBalancer
  selector:
    app: deploy-platform
  ports:
  - port: 80
    targetPort: 3000
    protocol: TCP
```

**ingress.yaml**:

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: deploy-platform
  namespace: deploy-platform
  annotations:
    kubernetes.io/ingress.class: nginx
    cert-manager.io/cluster-issuer: letsencrypt-prod
spec:
  tls:
  - hosts:
    - deploy.example.com
    secretName: deploy-platform-tls
  rules:
  - host: deploy.example.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: deploy-platform
            port:
              number: 80
```

Apply manifests:

```bash
kubectl apply -f deployment.yaml
kubectl apply -f service.yaml
kubectl apply -f ingress.yaml
```

## AWS Deployment

### Using ECS/Fargate

Create task definition:

```json
{
  "family": "deploy-platform",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "1024",
  "memory": "2048",
  "containerDefinitions": [
    {
      "name": "api",
      "image": "deploy-platform:latest",
      "portMappings": [
        {
          "containerPort": 3000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "DB_TYPE",
          "value": "postgres"
        },
        {
          "name": "DB_HOST",
          "value": "your-rds-endpoint"
        }
      ],
      "secrets": [
        {
          "name": "DB_PASSWORD",
          "valueFrom": "arn:aws:secretsmanager:..."
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/deploy-platform",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "api"
        }
      }
    }
  ]
}
```

Create service:

```bash
# Create ECS cluster
aws ecs create-cluster --cluster-name deploy-platform

# Register task definition
aws ecs register-task-definition --cli-input-json file://task-definition.json

# Create service
aws ecs create-service \
  --cluster deploy-platform \
  --service-name deploy-platform-api \
  --task-definition deploy-platform:1 \
  --desired-count 3 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-xxx],securityGroups=[sg-xxx],assignPublicIp=ENABLED}" \
  --load-balancers "targetGroupArn=arn:aws:elasticloadbalancing:...,containerName=api,containerPort=3000"
```

### Using Terraform

```hcl
# main.tf
terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = "us-east-1"
}

# VPC
resource "aws_vpc" "main" {
  cidr_block = "10.0.0.0/16"

  tags = {
    Name = "deploy-platform-vpc"
  }
}

# RDS Database
resource "aws_db_instance" "main" {
  identifier        = "deploy-platform-db"
  engine            = "postgres"
  engine_version    = "14"
  instance_class    = "db.t3.medium"
  allocated_storage = 100

  db_name  = "deploy_platform"
  username = "deploy"
  password = var.db_password

  vpc_security_group_ids = [aws_security_group.db.id]
  db_subnet_group_name   = aws_db_subnet_group.main.name

  backup_retention_period = 7
  skip_final_snapshot     = false
  final_snapshot_identifier = "deploy-platform-final-snapshot"

  tags = {
    Name = "deploy-platform-db"
  }
}

# S3 Bucket
resource "aws_s3_bucket" "deployments" {
  bucket = "deploy-platform-deployments"

  tags = {
    Name = "deploy-platform-deployments"
  }
}

# ECS Cluster
resource "aws_ecs_cluster" "main" {
  name = "deploy-platform"

  tags = {
    Name = "deploy-platform"
  }
}

# ECS Service
resource "aws_ecs_service" "api" {
  name            = "deploy-platform-api"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.api.arn
  desired_count   = 3
  launch_type     = "FARGATE"

  network_configuration {
    subnets         = aws_subnet.private[*].id
    security_groups = [aws_security_group.api.id]
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.api.arn
    container_name   = "api"
    container_port   = 3000
  }
}
```

Deploy:

```bash
terraform init
terraform plan
terraform apply
```

## GCP Deployment

### Using Cloud Run

```bash
# Build and push image
gcloud builds submit --tag gcr.io/PROJECT_ID/deploy-platform

# Deploy to Cloud Run
gcloud run deploy deploy-platform \
  --image gcr.io/PROJECT_ID/deploy-platform \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars "DB_TYPE=postgres,DB_HOST=/cloudsql/PROJECT_ID:REGION:INSTANCE" \
  --add-cloudsql-instances PROJECT_ID:REGION:INSTANCE \
  --memory 2Gi \
  --cpu 2 \
  --min-instances 1 \
  --max-instances 10
```

### Using GKE

```bash
# Create GKE cluster
gcloud container clusters create deploy-platform \
  --region us-central1 \
  --num-nodes 3 \
  --machine-type n1-standard-2 \
  --enable-autoscaling \
  --min-nodes 3 \
  --max-nodes 10

# Get credentials
gcloud container clusters get-credentials deploy-platform \
  --region us-central1

# Deploy application
kubectl apply -f k8s/
```

## Azure Deployment

### Using Container Instances

```bash
# Create resource group
az group create --name deploy-platform --location eastus

# Create container instance
az container create \
  --resource-group deploy-platform \
  --name deploy-platform-api \
  --image deploy-platform:latest \
  --cpu 2 \
  --memory 4 \
  --ports 3000 \
  --environment-variables \
    DB_TYPE=postgres \
    DB_HOST=postgres-server.postgres.database.azure.com \
  --secure-environment-variables \
    DB_PASSWORD=secret \
  --dns-name-label deploy-platform
```

### Using AKS

```bash
# Create AKS cluster
az aks create \
  --resource-group deploy-platform \
  --name deploy-platform-cluster \
  --node-count 3 \
  --enable-addons monitoring \
  --generate-ssh-keys

# Get credentials
az aks get-credentials \
  --resource-group deploy-platform \
  --name deploy-platform-cluster

# Deploy application
kubectl apply -f k8s/
```

## Configuration

### Database Configuration

**PostgreSQL**:

```sql
-- Create database
CREATE DATABASE deploy_platform;

-- Create user
CREATE USER deploy WITH PASSWORD 'secret';

-- Grant permissions
GRANT ALL PRIVILEGES ON DATABASE deploy_platform TO deploy;
```

**Connection pooling**:

```bash
# Using PgBouncer
[databases]
deploy_platform = host=postgres-server port=5432 dbname=deploy_platform

[pgbouncer]
pool_mode = transaction
max_client_conn = 1000
default_pool_size = 25
```

### Storage Configuration

**S3**:

```bash
# Create bucket
aws s3 mb s3://deploy-platform-deployments

# Set bucket policy
aws s3api put-bucket-policy \
  --bucket deploy-platform-deployments \
  --policy file://bucket-policy.json

# Enable versioning
aws s3api put-bucket-versioning \
  --bucket deploy-platform-deployments \
  --versioning-configuration Status=Enabled

# Set lifecycle policy
aws s3api put-bucket-lifecycle-configuration \
  --bucket deploy-platform-deployments \
  --lifecycle-configuration file://lifecycle.json
```

**GCS**:

```bash
# Create bucket
gsutil mb gs://deploy-platform-deployments

# Set IAM policy
gsutil iam ch serviceAccount:deploy@project.iam.gserviceaccount.com:objectAdmin \
  gs://deploy-platform-deployments
```

### SSL Configuration

**Let's Encrypt with Certbot**:

```bash
# Install Certbot
apt-get install certbot

# Get certificate
certbot certonly --standalone \
  -d deploy.example.com \
  --email admin@example.com \
  --agree-tos

# Auto-renewal
echo "0 0 * * * certbot renew --quiet" | crontab -
```

**Custom SSL**:

```bash
# Install certificate
cp cert.pem /etc/ssl/certs/deploy-platform.crt
cp key.pem /etc/ssl/private/deploy-platform.key

# Set permissions
chmod 644 /etc/ssl/certs/deploy-platform.crt
chmod 600 /etc/ssl/private/deploy-platform.key
```

## Security

### Firewall Rules

```bash
# Allow HTTP/HTTPS
ufw allow 80/tcp
ufw allow 443/tcp

# Allow SSH (for management)
ufw allow 22/tcp

# Enable firewall
ufw enable
```

### Security Headers

Configure in `deploy.json`:

```json
{
  "routes": [
    {
      "src": "/(.*)",
      "headers": {
        "X-Frame-Options": "DENY",
        "X-Content-Type-Options": "nosniff",
        "X-XSS-Protection": "1; mode=block",
        "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
        "Content-Security-Policy": "default-src 'self'",
        "Referrer-Policy": "strict-origin-when-cross-origin"
      }
    }
  ]
}
```

### Secrets Management

**AWS Secrets Manager**:

```bash
# Create secret
aws secretsmanager create-secret \
  --name deploy-platform/db-password \
  --secret-string "your-secure-password"

# Retrieve secret
aws secretsmanager get-secret-value \
  --secret-id deploy-platform/db-password
```

**HashiCorp Vault**:

```bash
# Enable secrets engine
vault secrets enable -path=deploy-platform kv-v2

# Write secret
vault kv put deploy-platform/db password="your-secure-password"

# Read secret
vault kv get deploy-platform/db
```

## Monitoring

### Prometheus

```yaml
# prometheus.yml
scrape_configs:
  - job_name: 'deploy-platform'
    static_configs:
      - targets: ['localhost:9090']
```

### Grafana

```bash
# Import dashboard
curl -X POST http://localhost:3000/api/dashboards/db \
  -H "Content-Type: application/json" \
  -d @grafana-dashboard.json
```

### Alerts

```yaml
# alertmanager.yml
receivers:
  - name: 'slack'
    slack_configs:
      - api_url: 'https://hooks.slack.com/services/...'
        channel: '#deploy-alerts'

route:
  receiver: 'slack'
  group_by: ['alertname']
```

## Backup & Recovery

### Database Backup

```bash
# Backup
pg_dump deploy_platform > backup.sql

# Restore
psql deploy_platform < backup.sql
```

### Automated Backups

```bash
#!/bin/bash
# backup.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/var/backups/deploy-platform"

# Database backup
pg_dump deploy_platform | gzip > $BACKUP_DIR/db_$DATE.sql.gz

# Storage backup
aws s3 sync s3://deploy-platform-deployments $BACKUP_DIR/storage_$DATE/

# Cleanup old backups (keep 30 days)
find $BACKUP_DIR -mtime +30 -delete
```

## Troubleshooting

### Common Issues

**Port already in use**:

```bash
# Find process using port
lsof -i :3000

# Kill process
kill -9 <PID>
```

**Database connection failed**:

```bash
# Check database status
systemctl status postgresql

# Check connectivity
psql -h localhost -U deploy -d deploy_platform
```

**Build failures**:

```bash
# Check build logs
tail -f /var/log/deploy-platform/build.log

# Clear build cache
rm -rf /var/cache/deploy-platform/*
```

### Logs

```bash
# View logs
journalctl -u deploy-platform -f

# View specific logs
tail -f /var/log/deploy-platform/api.log
tail -f /var/log/deploy-platform/builder.log
```

### Performance Issues

```bash
# Check resource usage
top
htop
vmstat 1

# Check disk usage
df -h
du -sh /var/builds/*

# Check network
netstat -tulpn
ss -tulpn
```
