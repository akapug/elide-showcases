# Deployment Guide

Production deployment guide for the Edge Compute Platform.

## Table of Contents

- [Production Considerations](#production-considerations)
- [Deployment Options](#deployment-options)
- [Configuration](#configuration)
- [Scaling](#scaling)
- [Security](#security)
- [Monitoring](#monitoring)
- [Troubleshooting](#troubleshooting)

## Production Considerations

Before deploying to production, consider these requirements:

### Performance

1. **Runtime Pool**: Increase pool size for higher concurrency
2. **Caching**: Enable and tune caching for better performance
3. **Storage**: Use persistent storage for KV and cache
4. **Load Balancing**: Deploy multiple instances with load balancer

### Security

1. **Authentication**: Add API key or OAuth2 authentication
2. **Authorization**: Implement function-level permissions
3. **Rate Limiting**: Add rate limiting per user/IP
4. **Input Validation**: Validate all function inputs
5. **Secrets Management**: Use environment variables or vault

### Reliability

1. **Health Checks**: Implement health check endpoints
2. **Auto-Recovery**: Add automatic restart on failure
3. **Backup**: Regular backups of function code and data
4. **Monitoring**: Set up alerts for errors and performance

## Deployment Options

### Option 1: Single Server

Simple deployment on a single server.

```bash
# Install dependencies
npm install

# Build TypeScript
npx tsc

# Start platform
NODE_ENV=production node dist/platform.js
```

**Configuration:**

```typescript
const platform = new EdgeComputePlatform({
  storageDir: '/var/lib/edge-compute/functions',
  dataDir: '/var/lib/edge-compute/data',
  logLevel: 'info',
  enableMetrics: true,
  enableTracing: true,
  poolConfig: {
    minSize: 4,
    maxSize: 20,
  },
});
```

**Pros:**
- Simple setup
- Low cost
- Easy debugging

**Cons:**
- Single point of failure
- Limited scalability
- No geographic distribution

### Option 2: Multi-Server with Load Balancer

Deploy across multiple servers with a load balancer.

```
┌─────────────┐
│Load Balancer│
└──────┬──────┘
       │
   ┌───┴────┬────────┬────────┐
   │        │        │        │
┌──▼───┐ ┌──▼───┐ ┌──▼───┐ ┌──▼───┐
│Server│ │Server│ │Server│ │Server│
│  1   │ │  2   │ │  3   │ │  4   │
└──────┘ └──────┘ └──────┘ └──────┘
```

**Setup:**

1. Deploy platform on each server
2. Share storage via NFS or S3
3. Share data via Redis or DynamoDB
4. Configure load balancer (Nginx, HAProxy)

**Nginx Configuration:**

```nginx
upstream edge_compute {
    least_conn;
    server server1:3000;
    server server2:3000;
    server server3:3000;
    server server4:3000;
}

server {
    listen 80;
    server_name edge.example.com;

    location / {
        proxy_pass http://edge_compute;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

### Option 3: Kubernetes

Deploy on Kubernetes for auto-scaling and high availability.

**Deployment:**

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: edge-compute
spec:
  replicas: 4
  selector:
    matchLabels:
      app: edge-compute
  template:
    metadata:
      labels:
        app: edge-compute
    spec:
      containers:
      - name: edge-compute
        image: edge-compute:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
        - name: STORAGE_DIR
          value: "/data/functions"
        - name: DATA_DIR
          value: "/data/kv"
        resources:
          requests:
            memory: "512Mi"
            cpu: "500m"
          limits:
            memory: "2Gi"
            cpu: "2000m"
        volumeMounts:
        - name: data
          mountPath: /data
      volumes:
      - name: data
        persistentVolumeClaim:
          claimName: edge-compute-data
```

**Service:**

```yaml
apiVersion: v1
kind: Service
metadata:
  name: edge-compute
spec:
  selector:
    app: edge-compute
  ports:
  - port: 80
    targetPort: 3000
  type: LoadBalancer
```

**Horizontal Pod Autoscaler:**

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: edge-compute
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: edge-compute
  minReplicas: 4
  maxReplicas: 20
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
```

### Option 4: Docker Compose

Quick deployment with Docker Compose.

```yaml
version: '3.8'

services:
  edge-compute:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - STORAGE_DIR=/data/functions
      - DATA_DIR=/data/kv
      - REDIS_URL=redis://redis:6379
    volumes:
      - ./data:/data
    depends_on:
      - redis
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
    depends_on:
      - edge-compute
    restart: unless-stopped

volumes:
  redis-data:
```

## Configuration

### Environment Variables

```bash
# Server
PORT=3000
HOST=0.0.0.0
NODE_ENV=production

# Storage
STORAGE_DIR=/var/lib/edge-compute/functions
DATA_DIR=/var/lib/edge-compute/data

# Logging
LOG_LEVEL=info
LOG_FILE=/var/log/edge-compute/app.log

# Metrics
METRICS_ENABLED=true
METRICS_PORT=9090

# Cache
CACHE_MAX_SIZE=10000
CACHE_TTL=300

# Pool
POOL_MIN_SIZE=4
POOL_MAX_SIZE=20

# Redis (optional)
REDIS_URL=redis://localhost:6379

# Database (optional)
DB_URL=postgresql://localhost/edge_compute
```

### Configuration File

```typescript
// config/production.ts
export default {
  platform: {
    storageDir: process.env.STORAGE_DIR || '/var/lib/edge-compute/functions',
    dataDir: process.env.DATA_DIR || '/var/lib/edge-compute/data',
    logLevel: 'info',
    enableMetrics: true,
    enableTracing: true,
    enableCaching: true,
    poolConfig: {
      minSize: parseInt(process.env.POOL_MIN_SIZE || '4'),
      maxSize: parseInt(process.env.POOL_MAX_SIZE || '20'),
    },
  },
  kv: {
    persistent: true,
    maxSize: 100000,
    maxMemory: 1024 * 1024 * 1024, // 1GB
    evictionPolicy: 'lru',
  },
  cache: {
    maxSize: 10000,
    defaultTTL: 300,
  },
};
```

## Scaling

### Vertical Scaling

Increase resources on a single server:

```typescript
const platform = new EdgeComputePlatform({
  poolConfig: {
    minSize: 10,
    maxSize: 50,
  },
});
```

### Horizontal Scaling

Add more servers behind a load balancer:

1. Deploy platform on multiple servers
2. Share storage (NFS, S3)
3. Share cache (Redis, Memcached)
4. Configure load balancer

### Auto-Scaling

Use Kubernetes HPA or AWS Auto Scaling:

```bash
# Kubernetes
kubectl autoscale deployment edge-compute --min=4 --max=20 --cpu-percent=70

# AWS
aws autoscaling create-auto-scaling-group \
  --auto-scaling-group-name edge-compute \
  --min-size 4 \
  --max-size 20 \
  --target-group-arns arn:aws:elasticloadbalancing:...
```

## Security

### Authentication

Add API key authentication:

```typescript
function authenticate(req: any): boolean {
  const apiKey = req.headers['x-api-key'];
  return isValidApiKey(apiKey);
}

// In platform
platform.on('invoke', (req) => {
  if (!authenticate(req)) {
    throw new Error('Unauthorized');
  }
});
```

### Rate Limiting

Add rate limiting:

```typescript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
  message: 'Too many requests',
});

app.use('/api', limiter);
```

### HTTPS

Enable HTTPS with Let's Encrypt:

```bash
# Install certbot
sudo apt-get install certbot

# Get certificate
sudo certbot certonly --standalone -d edge.example.com

# Configure Nginx
server {
    listen 443 ssl;
    server_name edge.example.com;

    ssl_certificate /etc/letsencrypt/live/edge.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/edge.example.com/privkey.pem;

    location / {
        proxy_pass http://localhost:3000;
    }
}
```

## Monitoring

### Metrics Endpoint

Expose Prometheus metrics:

```typescript
app.get('/metrics', (req, res) => {
  const metrics = platform.getMetrics();
  res.type('text/plain');
  res.send(metrics.exportPrometheus());
});
```

### Health Check

Add health check endpoint:

```typescript
app.get('/health', (req, res) => {
  const status = platform.getStatus();
  res.json(status);
});
```

### Logging

Configure structured logging:

```typescript
const logger = new Logger({
  level: 'info',
  console: true,
  file: true,
  filePath: '/var/log/edge-compute/app.log',
});
```

### Alerting

Set up alerts with Prometheus:

```yaml
# prometheus-rules.yml
groups:
  - name: edge_compute
    rules:
      - alert: HighErrorRate
        expr: rate(requests_error[5m]) > 0.05
        annotations:
          summary: High error rate detected

      - alert: HighLatency
        expr: request_duration_p95 > 1000
        annotations:
          summary: High latency detected
```

## Troubleshooting

### High Memory Usage

Check pool size and cache settings:

```typescript
const stats = platform.getStatus();
console.log('Pool:', stats.components.runtime);
console.log('Cache:', stats.components.cache);

// Reduce pool size
platform = new EdgeComputePlatform({
  poolConfig: { maxSize: 10 },
});
```

### Slow Function Execution

Enable tracing to identify bottlenecks:

```typescript
const tracer = platform.getTracer();
const traces = tracer.searchTraces({
  minDuration: 1000, // Slow requests > 1s
  limit: 10,
});

console.log('Slow traces:', traces);
```

### Function Deployment Failures

Check deployment logs:

```typescript
const service = platform.deploymentService;
const history = service.getDeploymentHistory({ limit: 10 });

history
  .filter((d) => !d.success)
  .forEach((d) => {
    console.log('Failed:', d.functionId, d.errors);
  });
```

### High Error Rate

Search error logs:

```typescript
const logger = platform.getLogger();
const errors = logger.search('error', {
  level: 'error',
  limit: 100,
});

console.log('Recent errors:', errors);
```

## Backup and Recovery

### Backup Functions

```bash
# Backup function code
tar -czf functions-backup.tar.gz /var/lib/edge-compute/functions

# Backup KV data
tar -czf data-backup.tar.gz /var/lib/edge-compute/data
```

### Recovery

```bash
# Restore function code
tar -xzf functions-backup.tar.gz -C /var/lib/edge-compute

# Restore KV data
tar -xzf data-backup.tar.gz -C /var/lib/edge-compute

# Restart platform
systemctl restart edge-compute
```

## Performance Tuning

### Optimize Pool Size

```typescript
// Monitor pool usage
const stats = pool.getStats();
console.log(`Active: ${stats.active}/${stats.total}`);

// Adjust based on load
if (stats.active === stats.total) {
  // Increase pool size
}
```

### Enable Caching

```typescript
// Cache frequently accessed data
cache.set('config', configData, { ttl: 3600 });

// Cache function responses
cache.set(`response:${key}`, result, { ttl: 300 });
```

### Use Redis for Distributed Cache

```typescript
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

// Use Redis instead of in-memory cache
await redis.set('key', JSON.stringify(value), 'EX', 300);
const cached = await redis.get('key');
```

## Production Checklist

- [ ] Configure environment variables
- [ ] Enable HTTPS
- [ ] Set up authentication
- [ ] Configure rate limiting
- [ ] Enable metrics and logging
- [ ] Set up monitoring and alerts
- [ ] Configure backups
- [ ] Test failover
- [ ] Document runbooks
- [ ] Load test
- [ ] Security audit
- [ ] Performance tuning

## Advanced Deployment Patterns

### Blue-Green Deployment

Deploy new version alongside old version for zero-downtime updates:

```bash
# Deploy green (new version)
kubectl apply -f deployment-green.yaml

# Wait for health checks
kubectl wait --for=condition=ready pod -l version=green

# Switch traffic
kubectl patch service edge-compute -p '{"spec":{"selector":{"version":"green"}}}'

# Monitor for issues
# If OK, delete blue; if issues, rollback
kubectl delete deployment edge-compute-blue
```

### Canary Deployment

Gradually roll out new version:

```yaml
# Canary deployment with 10% traffic
apiVersion: networking.istio.io/v1alpha3
kind: VirtualService
metadata:
  name: edge-compute
spec:
  hosts:
  - edge-compute
  http:
  - match:
    - headers:
        canary:
          exact: "true"
    route:
    - destination:
        host: edge-compute
        subset: canary
  - route:
    - destination:
        host: edge-compute
        subset: stable
      weight: 90
    - destination:
        host: edge-compute
        subset: canary
      weight: 10
```

### Multi-Region Deployment

Deploy across multiple regions for global availability:

```
┌─────────────────────────────────────────┐
│         Global Load Balancer            │
└────┬──────────────┬────────────────┬────┘
     │              │                │
┌────▼────┐    ┌───▼────┐      ┌───▼────┐
│US-EAST  │    │EU-WEST │      │AP-EAST │
│Region   │    │Region  │      │Region  │
└─────────┘    └────────┘      └────────┘
```

**Setup:**

1. Deploy platform in each region
2. Configure shared storage (S3, GCS)
3. Set up global database replication
4. Configure DNS with GeoDNS or Anycast
5. Implement cross-region failover

## CI/CD Pipeline

### GitHub Actions Example

```yaml
name: Deploy Edge Compute

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm ci
      - run: npm test
      - run: npm run build

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Configure AWS
        uses: aws-actions/configure-aws-credentials@v1
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1
      - name: Deploy to ECS
        run: |
          aws ecs update-service \
            --cluster edge-compute \
            --service edge-compute-service \
            --force-new-deployment
```

## Container Optimization

### Dockerfile Best Practices

```dockerfile
# Multi-stage build for smaller images
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

# Production image
FROM node:18-alpine

RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

WORKDIR /app

COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/package.json ./

USER nodejs

EXPOSE 3000

CMD ["node", "dist/platform.js"]
```

### Image Optimization

```bash
# Use specific tags
FROM node:18.16.0-alpine

# Clean up
RUN npm prune --production && \
    rm -rf /root/.npm /tmp/*

# Minimize layers
RUN apk add --no-cache dumb-init && \
    npm ci --only=production && \
    npm cache clean --force
```

## Network Configuration

### CDN Integration

```typescript
// Cloudflare Workers integration
export default {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    // Route to edge compute
    const edgeResponse = await fetch(`https://edge.internal${url.pathname}`, {
      method: request.method,
      headers: request.headers,
      body: request.body,
    });

    // Add caching headers
    const response = new Response(edgeResponse.body, edgeResponse);
    response.headers.set('Cache-Control', 'public, max-age=300');

    return response;
  },
};
```

### DNS Configuration

```
; GeoDNS configuration
edge.example.com.  300  IN  A      1.2.3.4     ; US
edge.example.com.  300  IN  A      5.6.7.8     ; EU
edge.example.com.  300  IN  AAAA   2001:db8::1 ; IPv6

; Healthcheck
_health.edge.example.com.  60  IN  TXT  "status=healthy"
```

## Database Considerations

### Multi-Region Database Setup

```typescript
// DynamoDB Global Tables
const dynamodb = new AWS.DynamoDB();

await dynamodb.createGlobalTable({
  GlobalTableName: 'edge-compute-data',
  ReplicationGroup: [
    { RegionName: 'us-east-1' },
    { RegionName: 'eu-west-1' },
    { RegionName: 'ap-northeast-1' },
  ],
}).promise();
```

### Read Replicas

```typescript
// PostgreSQL read replicas
const writePool = new Pool({
  host: 'primary.db.example.com',
  database: 'edge_compute',
  max: 20,
});

const readPool = new Pool({
  host: 'replica.db.example.com',
  database: 'edge_compute',
  max: 50,
});

// Use write pool for mutations, read pool for queries
async function getUser(id: string) {
  return readPool.query('SELECT * FROM users WHERE id = $1', [id]);
}
```

## Cost Optimization

### Auto-Scaling Configuration

```yaml
# AWS Auto Scaling
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: edge-compute
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: edge-compute
  minReplicas: 2
  maxReplicas: 20
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
  behavior:
    scaleDown:
      stabilizationWindowSeconds: 300
      policies:
      - type: Percent
        value: 50
        periodSeconds: 60
    scaleUp:
      stabilizationWindowSeconds: 0
      policies:
      - type: Percent
        value: 100
        periodSeconds: 30
```

### Reserved Capacity

```bash
# Purchase reserved instances for baseline load
aws ec2 purchase-reserved-instances-offering \
  --reserved-instances-offering-id <offering-id> \
  --instance-count 5

# Use spot instances for burst capacity
aws ec2 request-spot-instances \
  --spot-price "0.05" \
  --instance-count 10 \
  --launch-specification file://spot-spec.json
```

## Disaster Recovery

### Backup Strategy

```bash
#!/bin/bash
# Daily backup script

BACKUP_DIR="/backups/$(date +%Y%m%d)"
mkdir -p "$BACKUP_DIR"

# Backup function code
tar -czf "$BACKUP_DIR/functions.tar.gz" /var/lib/edge-compute/functions

# Backup data
pg_dump edge_compute > "$BACKUP_DIR/database.sql"

# Upload to S3
aws s3 sync "$BACKUP_DIR" "s3://edge-compute-backups/$(date +%Y%m%d)/"

# Cleanup old backups (keep 30 days)
find /backups -type d -mtime +30 -exec rm -rf {} \;
```

### Recovery Procedure

```bash
# 1. Provision new infrastructure
terraform apply -var="region=us-west-2"

# 2. Restore from backup
aws s3 sync "s3://edge-compute-backups/latest/" /restore/

# 3. Restore database
psql edge_compute < /restore/database.sql

# 4. Restore functions
tar -xzf /restore/functions.tar.gz -C /var/lib/edge-compute/

# 5. Start services
systemctl start edge-compute

# 6. Verify health
curl http://localhost:3000/health
```

## Compliance and Security

### PCI-DSS Compliance

```typescript
// Encrypt sensitive data at rest
const crypto = require('crypto');

function encryptData(data: string, key: Buffer): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  let encrypted = cipher.update(data, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag();
  return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;
}

// Audit logging
function auditLog(action: string, user: string, details: any) {
  const log = {
    timestamp: new Date().toISOString(),
    action,
    user,
    details,
    ip: getClientIP(),
  };

  // Send to SIEM
  siem.log(JSON.stringify(log));
}
```

### GDPR Compliance

```typescript
// Data retention policy
async function cleanupOldData() {
  const retentionDays = 90;
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

  await db.query(
    'DELETE FROM user_logs WHERE created_at < $1',
    [cutoffDate]
  );

  console.log('Cleaned up data older than', retentionDays, 'days');
}

// Right to erasure
async function deleteUserData(userId: string) {
  await db.query('DELETE FROM users WHERE id = $1', [userId]);
  await db.query('DELETE FROM user_logs WHERE user_id = $1', [userId]);
  await cache.deletePattern(`user:${userId}:*`);

  auditLog('user_deletion', 'system', { userId });
}
```
