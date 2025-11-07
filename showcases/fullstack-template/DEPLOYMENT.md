# Deployment Guide

This guide covers various deployment strategies for the Full-Stack Template.

## Table of Contents

- [Development Deployment](#development-deployment)
- [Production Deployment](#production-deployment)
- [Docker Deployment](#docker-deployment)
- [Kubernetes Deployment](#kubernetes-deployment)
- [Environment Configuration](#environment-configuration)
- [Monitoring & Health Checks](#monitoring--health-checks)
- [Troubleshooting](#troubleshooting)

## Development Deployment

### Option 1: Vite Dev Server + Backend Server

This provides the best development experience with hot module replacement.

**Terminal 1 - Frontend**:
```bash
cd frontend
npm install
npm run dev
```

**Terminal 2 - Backend**:
```bash
cd backend
npm install
elide run server.ts
# or
node --loader ts-node/esm server.ts
```

**Access**:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8080/api
- Health Check: http://localhost:8080/api/health

### Option 2: Production Build in Development

Test the production build locally:

```bash
# Build frontend
cd frontend
npm install
npm run build

# Run backend (serves both API and static files)
cd backend
npm install
elide run server.ts
```

**Access**:
- Application: http://localhost:8080
- API: http://localhost:8080/api

## Production Deployment

### Prerequisites

- Elide runtime installed
- Node.js (for building frontend)
- Production environment variables configured

### Build Process

```bash
# 1. Install dependencies
cd frontend && npm install --production
cd ../backend && npm install --production

# 2. Build frontend
cd ../frontend
npm run build

# 3. Verify build
ls -la dist/

# 4. Run production server
cd ../backend
NODE_ENV=production PORT=8080 elide run server.ts
```

### Production Configuration

Create a `.env` file in the backend directory:

```bash
NODE_ENV=production
PORT=8080
HOST=0.0.0.0
CORS_ORIGIN=https://yourdomain.com
```

### Process Management

Use PM2 or similar for process management:

```bash
# Install PM2
npm install -g pm2

# Start server
pm2 start backend/server.ts --name fullstack-api --interpreter elide

# Monitor
pm2 status
pm2 logs fullstack-api

# Auto-restart on crash
pm2 startup
pm2 save
```

## Docker Deployment

### Dockerfile

Create `Dockerfile` in project root:

```dockerfile
FROM node:20-alpine AS frontend-builder

WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci --production
COPY frontend/ ./
RUN npm run build

FROM elide:latest AS runtime

WORKDIR /app
COPY backend/ ./backend/
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

WORKDIR /app/backend
RUN npm ci --production

EXPOSE 8080

ENV NODE_ENV=production
ENV PORT=8080
ENV HOST=0.0.0.0

CMD ["elide", "run", "server.ts"]
```

### Build and Run

```bash
# Build image
docker build -t fullstack-template:latest .

# Run container
docker run -d \
  --name fullstack-app \
  -p 8080:8080 \
  -e NODE_ENV=production \
  -e CORS_ORIGIN=https://yourdomain.com \
  fullstack-template:latest

# Check logs
docker logs -f fullstack-app

# Stop container
docker stop fullstack-app
```

### Docker Compose

Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "8080:8080"
    environment:
      - NODE_ENV=production
      - PORT=8080
      - HOST=0.0.0.0
      - CORS_ORIGIN=https://yourdomain.com
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8080/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  # Optional: Add PostgreSQL
  # db:
  #   image: postgres:15-alpine
  #   environment:
  #     POSTGRES_DB: fullstack
  #     POSTGRES_USER: user
  #     POSTGRES_PASSWORD: password
  #   volumes:
  #     - postgres-data:/var/lib/postgresql/data

# volumes:
#   postgres-data:
```

Run with Docker Compose:

```bash
docker-compose up -d
docker-compose logs -f
docker-compose down
```

## Kubernetes Deployment

### Deployment Configuration

Create `k8s/deployment.yaml`:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: fullstack-template
  labels:
    app: fullstack-template
spec:
  replicas: 3
  selector:
    matchLabels:
      app: fullstack-template
  template:
    metadata:
      labels:
        app: fullstack-template
    spec:
      containers:
      - name: app
        image: fullstack-template:latest
        ports:
        - containerPort: 8080
        env:
        - name: NODE_ENV
          value: "production"
        - name: PORT
          value: "8080"
        - name: HOST
          value: "0.0.0.0"
        - name: CORS_ORIGIN
          valueFrom:
            configMapKeyRef:
              name: app-config
              key: cors.origin
        resources:
          requests:
            memory: "128Mi"
            cpu: "100m"
          limits:
            memory: "256Mi"
            cpu: "200m"
        livenessProbe:
          httpGet:
            path: /api/health/live
            port: 8080
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /api/health/ready
            port: 8080
          initialDelaySeconds: 10
          periodSeconds: 5
```

### Service Configuration

Create `k8s/service.yaml`:

```yaml
apiVersion: v1
kind: Service
metadata:
  name: fullstack-template
spec:
  selector:
    app: fullstack-template
  ports:
  - protocol: TCP
    port: 80
    targetPort: 8080
  type: LoadBalancer
```

### ConfigMap

Create `k8s/configmap.yaml`:

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: app-config
data:
  cors.origin: "https://yourdomain.com"
```

### Deploy to Kubernetes

```bash
# Create resources
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/service.yaml

# Check status
kubectl get deployments
kubectl get pods
kubectl get services

# View logs
kubectl logs -f deployment/fullstack-template

# Scale
kubectl scale deployment/fullstack-template --replicas=5

# Update
kubectl set image deployment/fullstack-template app=fullstack-template:v2

# Delete
kubectl delete -f k8s/
```

## Environment Configuration

### Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `NODE_ENV` | Environment (development/production) | `development` | No |
| `PORT` | Server port | `8080` | No |
| `HOST` | Server host | `localhost` | No |
| `CORS_ORIGIN` | Allowed CORS origins | `*` | Yes (production) |

### Production Environment Setup

```bash
# .env file
NODE_ENV=production
PORT=8080
HOST=0.0.0.0
CORS_ORIGIN=https://yourdomain.com,https://www.yourdomain.com
```

### Load Environment Variables

```bash
# Using dotenv (if installed)
export $(cat .env | xargs)

# Or manually
export NODE_ENV=production
export PORT=8080
```

## Monitoring & Health Checks

### Health Check Endpoints

**Liveness Probe** (is the app alive?):
```bash
curl http://localhost:8080/api/health/live
```

**Readiness Probe** (is the app ready for traffic?):
```bash
curl http://localhost:8080/api/health/ready
```

**Detailed Health**:
```bash
curl http://localhost:8080/api/health/detailed
```

### Metrics

The server logs provide metrics:
- Total requests
- Average response time
- Status code distribution

Access via `/api/health/detailed`:
```json
{
  "metrics": {
    "totalRequests": 1234,
    "averageResponseTime": 12.5,
    "statusCounts": {
      "2xx": 1200,
      "4xx": 30,
      "5xx": 4
    }
  }
}
```

### Logging

Server logs include:
- Request method and URL
- Response status code
- Response time
- Timestamp

Example log output:
```
[2024-01-15T10:30:45.123Z] GET /api/users - 200 - 8ms
[2024-01-15T10:30:46.456Z] POST /api/users - 201 - 12ms
```

## Troubleshooting

### Common Issues

#### Port Already in Use

```bash
# Find process using port
lsof -i :8080

# Kill process
kill -9 <PID>

# Or use different port
PORT=3000 elide run server.ts
```

#### CORS Errors

Check CORS configuration:
```typescript
// backend/middleware/cors.ts
const corsOptions = {
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
};
```

Set correct origin:
```bash
export CORS_ORIGIN=https://yourdomain.com
```

#### Static Files Not Serving

Verify frontend build:
```bash
cd frontend
npm run build
ls -la dist/
```

Check server path:
```typescript
// backend/server.ts
const frontendDistPath = path.join(process.cwd(), '../frontend/dist');
```

#### Database Connection Issues

If using external database:
```bash
# Check connection
psql -h localhost -U user -d fullstack

# Verify environment variables
echo $DATABASE_URL
```

### Debug Mode

Enable verbose logging:
```bash
DEBUG=* elide run server.ts
```

### Performance Issues

Run benchmarks:
```bash
cd tests
elide run benchmark.ts http://localhost:8080
```

Check metrics:
```bash
curl http://localhost:8080/api/health/detailed | json_pp
```

## Security Checklist

### Before Production Deployment

- [ ] Change default passwords
- [ ] Configure CORS to specific origins
- [ ] Implement proper password hashing (bcrypt/argon2)
- [ ] Use HTTPS in production
- [ ] Validate all user inputs
- [ ] Implement rate limiting
- [ ] Set up monitoring and alerts
- [ ] Enable security headers
- [ ] Regular dependency updates
- [ ] Implement proper error handling
- [ ] Set up backup strategy
- [ ] Configure firewall rules
- [ ] Use environment variables for secrets
- [ ] Implement API authentication
- [ ] Add request logging
- [ ] Set up intrusion detection

## Performance Optimization

### Frontend Optimization

- Enable production build optimizations
- Use CDN for static assets
- Implement code splitting
- Enable gzip compression
- Use lazy loading for components
- Optimize images

### Backend Optimization

- Implement caching (Redis)
- Use database connection pooling
- Add database indexes
- Implement pagination
- Use compression middleware
- Optimize queries

### Infrastructure

- Use load balancer
- Implement auto-scaling
- Set up CDN
- Use caching layers
- Optimize database queries
- Monitor and tune resources

## Backup Strategy

### Database Backups

```bash
# PostgreSQL backup
pg_dump -U user fullstack > backup_$(date +%Y%m%d).sql

# Restore
psql -U user fullstack < backup_20240115.sql
```

### Application State

For in-memory store, implement periodic snapshots:
```bash
# Automated backup script
0 2 * * * /path/to/backup-script.sh
```

---

For more information, see:
- [README.md](./README.md) - General overview
- [CASE_STUDY.md](./CASE_STUDY.md) - Architecture details
