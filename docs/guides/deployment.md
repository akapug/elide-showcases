# Deployment Guide for Elide Applications

**Comprehensive guide to deploying Elide applications to production**

Learn how to deploy Elide applications to various platforms including Docker, Kubernetes, serverless, and traditional servers.

---

## Table of Contents

- [Deployment Options](#deployment-options)
- [Docker Deployment](#docker-deployment)
- [Kubernetes Deployment](#kubernetes-deployment)
- [Serverless Deployment](#serverless-deployment)
- [Traditional Server](#traditional-server)
- [CI/CD Integration](#cicd-integration)
- [Environment Configuration](#environment-configuration)
- [Monitoring and Logging](#monitoring-and-logging)

---

## Deployment Options

### Platform Comparison

| Platform | Startup Time | Scaling | Cost | Complexity | Best For |
|----------|--------------|---------|------|------------|----------|
| **Docker** | Fast (~20ms) | Manual | Low | Low | VPS, cloud VMs |
| **Kubernetes** | Fast | Auto | Medium | High | Enterprise, microservices |
| **Serverless** | Fast | Auto | Pay-per-use | Low | APIs, edge functions |
| **Traditional** | Fast | Manual | Variable | Very Low | Simple deployments |
| **Edge** | Ultra-fast | Auto | Pay-per-use | Low | Global APIs |

---

## Docker Deployment

### Basic Dockerfile

```dockerfile
# Dockerfile
FROM ghcr.io/elide-dev/elide:latest

# Set working directory
WORKDIR /app

# Copy application files
COPY src/ ./src/

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD elide run --check || exit 1

# Run application
CMD ["elide", "run", "src/server.ts"]
```

### Build and Run

```bash
# Build image
docker build -t my-elide-app .

# Run container
docker run -d \
  --name my-elide-app \
  -p 3000:3000 \
  -e PORT=3000 \
  -e NODE_ENV=production \
  my-elide-app

# View logs
docker logs -f my-elide-app

# Stop container
docker stop my-elide-app
```

### Multi-Stage Build

```dockerfile
# Dockerfile.optimized
FROM ghcr.io/elide-dev/elide:latest AS builder

WORKDIR /app
COPY src/ ./src/

# Runtime stage
FROM ghcr.io/elide-dev/elide:latest

WORKDIR /app
COPY --from=builder /app/src ./src

EXPOSE 3000
CMD ["elide", "run", "src/server.ts"]
```

### Docker Compose

```yaml
# docker-compose.yml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - PORT=3000
      - NODE_ENV=production
      - DB_URL=postgresql://db:5432/myapp
    depends_on:
      - db
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 3s
      retries: 3

  db:
    image: postgres:15
    environment:
      - POSTGRES_DB=myapp
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres-data:/var/lib/postgresql/data
    restart: unless-stopped

volumes:
  postgres-data:
```

Run with Docker Compose:
```bash
docker-compose up -d
docker-compose logs -f
docker-compose down
```

---

## Kubernetes Deployment

### Deployment Manifest

```yaml
# deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: elide-app
  labels:
    app: elide-app
spec:
  replicas: 3
  selector:
    matchLabels:
      app: elide-app
  template:
    metadata:
      labels:
        app: elide-app
    spec:
      containers:
      - name: app
        image: my-registry/my-elide-app:latest
        ports:
        - containerPort: 3000
        env:
        - name: PORT
          value: "3000"
        - name: NODE_ENV
          value: "production"
        - name: DB_URL
          valueFrom:
            secretKeyRef:
              name: app-secrets
              key: db-url
        resources:
          requests:
            cpu: 100m
            memory: 128Mi
          limits:
            cpu: 500m
            memory: 512Mi
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 10
          periodSeconds: 30
        readinessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 10
```

### Service Manifest

```yaml
# service.yaml
apiVersion: v1
kind: Service
metadata:
  name: elide-app-service
spec:
  selector:
    app: elide-app
  ports:
  - protocol: TCP
    port: 80
    targetPort: 3000
  type: LoadBalancer
```

### Ingress Manifest

```yaml
# ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: elide-app-ingress
  annotations:
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
spec:
  tls:
  - hosts:
    - api.example.com
    secretName: elide-app-tls
  rules:
  - host: api.example.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: elide-app-service
            port:
              number: 80
```

### Deploy to Kubernetes

```bash
# Apply manifests
kubectl apply -f deployment.yaml
kubectl apply -f service.yaml
kubectl apply -f ingress.yaml

# Check status
kubectl get pods
kubectl get services
kubectl get ingress

# View logs
kubectl logs -f deployment/elide-app

# Scale deployment
kubectl scale deployment elide-app --replicas=5

# Update deployment
kubectl set image deployment/elide-app app=my-registry/my-elide-app:v2

# Rollback
kubectl rollout undo deployment/elide-app
```

---

## Serverless Deployment

### AWS Lambda

**Build deployment package:**

```bash
# Install Elide in Lambda-compatible layer
mkdir -p layer/bin
curl -sSL https://elide.sh | bash -s - --install-dir=layer/bin

# Package application
mkdir -p package
cp -r src package/
cp layer/bin/elide package/

# Create ZIP
cd package
zip -r ../function.zip .
```

**Lambda handler wrapper:**

```javascript
// lambda-handler.js
const { spawn } = require('child_process');
const handler = require('./src/server.ts');

exports.handler = async (event, context) => {
  // Convert API Gateway event to Request
  const request = new Request(event.path, {
    method: event.httpMethod,
    headers: event.headers,
    body: event.body
  });

  // Call Elide handler
  const response = await handler.default(request);

  // Convert Response to API Gateway format
  return {
    statusCode: response.status,
    headers: Object.fromEntries(response.headers),
    body: await response.text()
  };
};
```

### Cloudflare Workers

Elide Fetch handlers work great with Cloudflare Workers!

```typescript
// worker.ts
export default async function fetch(req: Request): Promise<Response> {
  const url = new URL(req.url);

  if (url.pathname === "/api/data") {
    return new Response(JSON.stringify({ data: "from edge" }), {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=3600"
      }
    });
  }

  return new Response("Not Found", { status: 404 });
}
```

Deploy:
```bash
wrangler publish
```

### Vercel

```json
// vercel.json
{
  "functions": {
    "api/*.ts": {
      "runtime": "elide@latest"
    }
  }
}
```

---

## Traditional Server

### Systemd Service

```ini
# /etc/systemd/system/elide-app.service
[Unit]
Description=Elide Application
After=network.target

[Service]
Type=simple
User=elide
WorkingDirectory=/opt/elide-app
ExecStart=/usr/local/bin/elide run src/server.ts
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal
SyslogIdentifier=elide-app

Environment=NODE_ENV=production
Environment=PORT=3000

[Install]
WantedBy=multi-user.target
```

**Manage service:**

```bash
# Enable and start
sudo systemctl enable elide-app
sudo systemctl start elide-app

# Check status
sudo systemctl status elide-app

# View logs
sudo journalctl -u elide-app -f

# Restart
sudo systemctl restart elide-app

# Stop
sudo systemctl stop elide-app
```

### Nginx Reverse Proxy

```nginx
# /etc/nginx/sites-available/elide-app
server {
    listen 80;
    server_name api.example.com;

    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.example.com;

    # SSL configuration
    ssl_certificate /etc/letsencrypt/live/api.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.example.com/privkey.pem;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;

    # Proxy to Elide app
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Health check
    location /health {
        proxy_pass http://localhost:3000/health;
        access_log off;
    }
}
```

Enable site:
```bash
sudo ln -s /etc/nginx/sites-available/elide-app /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## CI/CD Integration

### GitHub Actions

```yaml
# .github/workflows/deploy.yml
name: Deploy Elide Application

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Install Elide
        run: curl -sSL https://elide.sh | bash

      - name: Run tests
        run: |
          export PATH="$HOME/.elide/bin:$PATH"
          elide run tests/all.test.ts

  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Build Docker image
        run: docker build -t ${{ secrets.REGISTRY }}/my-app:${{ github.sha }} .

      - name: Push to registry
        run: |
          echo ${{ secrets.REGISTRY_PASSWORD }} | docker login -u ${{ secrets.REGISTRY_USER }} --password-stdin ${{ secrets.REGISTRY }}
          docker push ${{ secrets.REGISTRY }}/my-app:${{ github.sha }}

  deploy:
    needs: build
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to Kubernetes
        run: |
          kubectl set image deployment/elide-app app=${{ secrets.REGISTRY }}/my-app:${{ github.sha }}
          kubectl rollout status deployment/elide-app
```

### GitLab CI

```yaml
# .gitlab-ci.yml
stages:
  - test
  - build
  - deploy

test:
  stage: test
  image: ghcr.io/elide-dev/elide:latest
  script:
    - elide run tests/all.test.ts

build:
  stage: build
  image: docker:latest
  services:
    - docker:dind
  script:
    - docker build -t $CI_REGISTRY_IMAGE:$CI_COMMIT_SHA .
    - docker push $CI_REGISTRY_IMAGE:$CI_COMMIT_SHA

deploy:
  stage: deploy
  image: bitnami/kubectl:latest
  script:
    - kubectl set image deployment/elide-app app=$CI_REGISTRY_IMAGE:$CI_COMMIT_SHA
    - kubectl rollout status deployment/elide-app
  only:
    - main
```

---

## Environment Configuration

### Environment Variables

```typescript
// config.ts
export const config = {
  port: parseInt(process.env.PORT || "3000"),
  nodeEnv: process.env.NODE_ENV || "development",
  apiKey: process.env.API_KEY || "",
  dbUrl: process.env.DATABASE_URL || "",
  logLevel: process.env.LOG_LEVEL || "info",
  corsOrigin: process.env.CORS_ORIGIN || "*"
};

// Validate required variables
const required = ["API_KEY", "DATABASE_URL"];
for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}
```

### .env Files

**.env.development:**
```bash
PORT=3000
NODE_ENV=development
API_KEY=dev-key
DATABASE_URL=postgresql://localhost/myapp_dev
LOG_LEVEL=debug
CORS_ORIGIN=http://localhost:3001
```

**.env.production:**
```bash
PORT=3000
NODE_ENV=production
API_KEY=${API_KEY}  # Injected by deployment
DATABASE_URL=${DATABASE_URL}
LOG_LEVEL=info
CORS_ORIGIN=https://app.example.com
```

---

## Monitoring and Logging

### Structured Logging

```typescript
// logger.ts
export class Logger {
  log(level: string, message: string, meta?: any) {
    const entry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...meta
    };

    console.log(JSON.stringify(entry));
  }

  info(message: string, meta?: any) {
    this.log("info", message, meta);
  }

  error(message: string, error?: Error, meta?: any) {
    this.log("error", message, {
      ...meta,
      error: {
        message: error?.message,
        stack: error?.stack
      }
    });
  }

  warn(message: string, meta?: any) {
    this.log("warn", message, meta);
  }
}

// Usage
const logger = new Logger();

logger.info("Server started", { port: 3000 });
logger.error("Database connection failed", error, { attempts: 3 });
```

### Health Check Endpoint

```typescript
export default async function fetch(req: Request): Promise<Response> {
  if (req.url.includes("/health")) {
    const health = {
      status: "healthy",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: {
        used: process.memoryUsage().heapUsed,
        total: process.memoryUsage().heapTotal
      }
    };

    return new Response(JSON.stringify(health), {
      headers: { "Content-Type": "application/json" }
    });
  }

  // ... rest of handlers
}
```

### Metrics Endpoint

```typescript
class Metrics {
  private requests = 0;
  private errors = 0;
  private startTime = Date.now();

  incrementRequests() {
    this.requests++;
  }

  incrementErrors() {
    this.errors++;
  }

  getMetrics() {
    return {
      requests: this.requests,
      errors: this.errors,
      uptime: Date.now() - this.startTime,
      errorRate: this.requests > 0 ? this.errors / this.requests : 0
    };
  }
}

const metrics = new Metrics();

export default async function fetch(req: Request): Promise<Response> {
  metrics.incrementRequests();

  try {
    // Handle request
    return await handleRequest(req);
  } catch (error) {
    metrics.incrementErrors();
    throw error;
  }
}

// Metrics endpoint
if (req.url.includes("/metrics")) {
  return new Response(JSON.stringify(metrics.getMetrics()));
}
```

---

## Next Steps

- **[Monitoring Guide](./monitoring.md)** - Set up monitoring and alerting
- **[Security](./security.md)** - Secure production deployments
- **[Performance](./performance-optimization.md)** - Optimize for production
- **[Troubleshooting](./troubleshooting.md)** - Debug production issues

---

## Summary

**Deployment Options:**

- ✅ **Docker**: Simple, portable, works everywhere
- ✅ **Kubernetes**: Auto-scaling, enterprise-ready
- ✅ **Serverless**: Pay-per-use, auto-scaling
- ✅ **Traditional**: Simple VPS/dedicated server
- ✅ **Edge**: Ultra-fast global deployment

**Deployment Checklist:**

1. ✅ Choose deployment platform
2. ✅ Set up environment variables
3. ✅ Configure health checks
4. ✅ Set up logging and monitoring
5. ✅ Configure CI/CD pipeline
6. ✅ Set up SSL/TLS certificates
7. ✅ Configure reverse proxy (if needed)
8. ✅ Test deployment
9. ✅ Set up alerts
10. ✅ Document deployment process

**Best Practices:**

- Use environment variables for configuration
- Implement health checks
- Set up structured logging
- Monitor application metrics
- Automate deployments with CI/CD
- Use rolling deployments for zero downtime
- Keep deployment simple and reproducible

🚀 **Deploy Elide applications to production with confidence!**
