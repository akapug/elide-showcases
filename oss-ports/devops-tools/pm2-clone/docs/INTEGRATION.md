# PM2 Clone Integration Guide

Complete integration guide for PM2 Clone with various platforms, frameworks, and deployment strategies.

## Table of Contents

- [Docker Integration](#docker-integration)
- [Kubernetes Integration](#kubernetes-integration)
- [CI/CD Integration](#cicd-integration)
- [Cloud Platforms](#cloud-platforms)
- [Monitoring Integration](#monitoring-integration)
- [Load Balancer Integration](#load-balancer-integration)
- [Database Integration](#database-integration)
- [Message Queue Integration](#message-queue-integration)

## Docker Integration

### Basic Dockerfile

```dockerfile
FROM elide:latest

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Install PM2 Clone globally
RUN elide build pm2.ts

EXPOSE 3000

CMD ["elide", "pm2.ts", "start", "ecosystem.config.ts", "--no-daemon"]
```

### Multi-Stage Build

```dockerfile
# Build stage
FROM elide:latest AS builder

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Production stage
FROM elide:latest

WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY ecosystem.config.ts ./

CMD ["elide", "pm2.ts", "start", "ecosystem.config.ts", "--no-daemon"]
```

### Docker Compose with PM2

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000-3003:3000-3003"
    environment:
      - NODE_ENV=production
      - DB_HOST=postgres
      - REDIS_HOST=redis
    volumes:
      - ./logs:/app/.pm2/logs
    depends_on:
      - postgres
      - redis
    restart: always

  postgres:
    image: postgres:14
    environment:
      - POSTGRES_DB=myapp
      - POSTGRES_PASSWORD=secret
    volumes:
      - db-data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    volumes:
      - redis-data:/data

volumes:
  db-data:
  redis-data:
```

### Health Check

```dockerfile
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s \
  CMD elide pm2.ts list | grep -q "online" || exit 1
```

## Kubernetes Integration

### Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: myapp
  labels:
    app: myapp
spec:
  replicas: 3
  selector:
    matchLabels:
      app: myapp
  template:
    metadata:
      labels:
        app: myapp
    spec:
      containers:
      - name: app
        image: myapp:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
        - name: PM2_INSTANCES
          value: "4"
        resources:
          requests:
            memory: "512Mi"
            cpu: "500m"
          limits:
            memory: "1Gi"
            cpu: "1000m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
```

### Service

```yaml
apiVersion: v1
kind: Service
metadata:
  name: myapp-service
spec:
  selector:
    app: myapp
  ports:
  - protocol: TCP
    port: 80
    targetPort: 3000
  type: LoadBalancer
```

### ConfigMap

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: pm2-config
data:
  ecosystem.config.ts: |
    export default {
      apps: [{
        name: 'myapp',
        script: './dist/index.js',
        instances: process.env.PM2_INSTANCES || 'max',
        exec_mode: 'cluster',
        env: {
          NODE_ENV: 'production'
        }
      }]
    };
```

### Horizontal Pod Autoscaler

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: myapp-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: myapp
  minReplicas: 2
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

## CI/CD Integration

### GitHub Actions

```yaml
name: Deploy with PM2

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Elide
        uses: elide/setup-elide@v1

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build

      - name: Deploy to server
        env:
          SSH_KEY: ${{ secrets.SSH_KEY }}
          SERVER_HOST: ${{ secrets.SERVER_HOST }}
        run: |
          echo "$SSH_KEY" > deploy_key
          chmod 600 deploy_key
          rsync -avz -e "ssh -i deploy_key -o StrictHostKeyChecking=no" \
            --exclude node_modules \
            --exclude .git \
            . user@$SERVER_HOST:/app

          ssh -i deploy_key -o StrictHostKeyChecking=no user@$SERVER_HOST << 'EOF'
            cd /app
            npm install --production
            elide pm2.ts reload ecosystem.config.ts --update-env
          EOF
```

### GitLab CI

```yaml
stages:
  - build
  - test
  - deploy

build:
  stage: build
  script:
    - npm ci
    - npm run build
  artifacts:
    paths:
      - dist/
    expire_in: 1 hour

test:
  stage: test
  script:
    - npm test
    - npm run lint

deploy:
  stage: deploy
  only:
    - main
  script:
    - apt-get update && apt-get install -y rsync openssh-client
    - mkdir -p ~/.ssh
    - echo "$SSH_PRIVATE_KEY" > ~/.ssh/id_rsa
    - chmod 600 ~/.ssh/id_rsa
    - rsync -avz --exclude node_modules . user@$SERVER_HOST:/app
    - ssh user@$SERVER_HOST "cd /app && npm install --production && elide pm2.ts reload all"
```

### Jenkins Pipeline

```groovy
pipeline {
    agent any

    environment {
        SERVER_HOST = credentials('server-host')
        SSH_KEY = credentials('ssh-key')
    }

    stages {
        stage('Build') {
            steps {
                sh 'npm ci'
                sh 'npm run build'
            }
        }

        stage('Test') {
            steps {
                sh 'npm test'
                sh 'npm run lint'
            }
        }

        stage('Deploy') {
            when {
                branch 'main'
            }
            steps {
                sh '''
                    rsync -avz -e "ssh -i $SSH_KEY" \
                      --exclude node_modules \
                      . user@$SERVER_HOST:/app

                    ssh -i $SSH_KEY user@$SERVER_HOST \
                      "cd /app && npm install --production && elide pm2.ts reload all"
                '''
            }
        }
    }

    post {
        failure {
            slackSend color: 'danger', message: "Deployment failed: ${env.JOB_NAME} ${env.BUILD_NUMBER}"
        }
        success {
            slackSend color: 'good', message: "Deployment successful: ${env.JOB_NAME} ${env.BUILD_NUMBER}"
        }
    }
}
```

## Cloud Platforms

### AWS EC2

```bash
#!/bin/bash
# User data script for EC2 instance

# Install dependencies
curl -fsSL https://elide.dev/install.sh | sh
cd /home/ec2-user/app

# Install application
npm install

# Setup PM2 startup
elide pm2.ts startup systemd -u ec2-user --hp /home/ec2-user
elide pm2.ts start ecosystem.config.ts
elide pm2.ts save

# Configure CloudWatch logs
cat > /etc/pm2-cloudwatch-config.json << EOF
{
  "logGroupName": "/aws/ec2/pm2-logs",
  "logStreamName": "${INSTANCE_ID}",
  "region": "us-east-1"
}
EOF
```

### AWS ECS Task Definition

```json
{
  "family": "myapp-task",
  "containerDefinitions": [
    {
      "name": "app",
      "image": "myapp:latest",
      "memory": 1024,
      "cpu": 512,
      "essential": true,
      "portMappings": [
        {
          "containerPort": 3000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "NODE_ENV",
          "value": "production"
        },
        {
          "name": "PM2_INSTANCES",
          "value": "4"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/myapp",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ],
  "requiresCompatibilities": ["FARGATE"],
  "networkMode": "awsvpc",
  "cpu": "512",
  "memory": "1024"
}
```

### Google Cloud Run

```dockerfile
FROM elide:latest

WORKDIR /app
COPY . .
RUN npm install

CMD ["elide", "pm2.ts", "start", "ecosystem.config.ts", "--no-daemon"]
```

Deploy:

```bash
gcloud run deploy myapp \
  --image gcr.io/PROJECT_ID/myapp \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --max-instances 10 \
  --memory 1Gi \
  --cpu 1
```

### Azure Container Instances

```yaml
apiVersion: 2019-12-01
location: eastus
name: myapp
properties:
  containers:
  - name: app
    properties:
      image: myapp:latest
      resources:
        requests:
          cpu: 1.0
          memoryInGb: 1.5
      ports:
      - port: 3000
        protocol: TCP
      environmentVariables:
      - name: NODE_ENV
        value: production
      - name: PM2_INSTANCES
        value: '4'
  osType: Linux
  restartPolicy: Always
  ipAddress:
    type: Public
    ports:
    - protocol: TCP
      port: 3000
    dnsNameLabel: myapp
tags: {}
type: Microsoft.ContainerInstance/containerGroups
```

### Heroku

```json
{
  "scripts": {
    "start": "elide pm2.ts start ecosystem.config.ts --no-daemon"
  }
}
```

Procfile:

```
web: elide pm2.ts start ecosystem.config.ts --no-daemon
```

## Monitoring Integration

### Prometheus

```typescript
// ecosystem.config.ts
export default {
  apps: [{
    name: 'myapp',
    script: './dist/index.js',
    instances: 4,
    exec_mode: 'cluster',
    env: {
      METRICS_PORT: 9090
    }
  }]
};
```

Prometheus config:

```yaml
scrape_configs:
  - job_name: 'pm2-metrics'
    static_configs:
      - targets: ['localhost:9090']
```

### Grafana Dashboard

```json
{
  "dashboard": {
    "title": "PM2 Metrics",
    "panels": [
      {
        "title": "Process Count",
        "targets": [
          {
            "expr": "pm2_process_count"
          }
        ]
      },
      {
        "title": "CPU Usage",
        "targets": [
          {
            "expr": "rate(pm2_cpu_usage[5m])"
          }
        ]
      },
      {
        "title": "Memory Usage",
        "targets": [
          {
            "expr": "pm2_memory_usage"
          }
        ]
      },
      {
        "title": "Restart Count",
        "targets": [
          {
            "expr": "increase(pm2_restart_count[1h])"
          }
        ]
      }
    ]
  }
}
```

### DataDog

```javascript
// Install DataDog integration
const StatsD = require('node-dogstatsd').StatsD;
const dogstatsd = new StatsD();

// Report metrics
setInterval(() => {
  const metrics = pm2.getMetrics();

  dogstatsd.gauge('pm2.process.count', metrics.processCount);
  dogstatsd.gauge('pm2.cpu.usage', metrics.cpuUsage);
  dogstatsd.gauge('pm2.memory.usage', metrics.memoryUsage);
  dogstatsd.increment('pm2.restarts', metrics.restarts);
}, 10000);
```

### New Relic

```javascript
// newrelic.js
exports.config = {
  app_name: ['My Application'],
  license_key: process.env.NEW_RELIC_LICENSE_KEY,
  logging: {
    level: 'info'
  },
  distributed_tracing: {
    enabled: true
  }
};
```

Ecosystem config:

```typescript
export default {
  apps: [{
    name: 'myapp',
    script: './dist/index.js',
    node_args: '-r newrelic',
    instances: 4,
    exec_mode: 'cluster'
  }]
};
```

## Load Balancer Integration

### Nginx

```nginx
upstream myapp {
    least_conn;
    server localhost:3000;
    server localhost:3001;
    server localhost:3002;
    server localhost:3003;

    keepalive 64;
}

server {
    listen 80;
    server_name myapp.com;

    location / {
        proxy_pass http://myapp;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    location /health {
        access_log off;
        proxy_pass http://myapp;
    }
}
```

### HAProxy

```haproxy
global
    daemon
    maxconn 4096

defaults
    mode http
    timeout connect 5s
    timeout client 50s
    timeout server 50s

frontend http-in
    bind *:80
    default_backend servers

backend servers
    balance roundrobin
    option httpchk GET /health
    server server1 localhost:3000 check
    server server2 localhost:3001 check
    server server3 localhost:3002 check
    server server4 localhost:3003 check
```

### AWS Application Load Balancer

```yaml
# terraform configuration
resource "aws_lb" "main" {
  name               = "myapp-lb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.lb.id]
  subnets            = aws_subnet.public.*.id
}

resource "aws_lb_target_group" "main" {
  name     = "myapp-tg"
  port     = 3000
  protocol = "HTTP"
  vpc_id   = aws_vpc.main.id

  health_check {
    enabled             = true
    path                = "/health"
    interval            = 30
    timeout             = 5
    healthy_threshold   = 2
    unhealthy_threshold = 2
  }
}

resource "aws_lb_listener" "main" {
  load_balancer_arn = aws_lb.main.arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.main.arn
  }
}
```

## Database Integration

### PostgreSQL

```typescript
// ecosystem.config.ts
export default {
  apps: [{
    name: 'myapp',
    script: './dist/index.js',
    instances: 4,
    exec_mode: 'cluster',
    env: {
      DB_HOST: 'postgres.internal',
      DB_PORT: 5432,
      DB_NAME: 'myapp',
      DB_USER: 'myapp_user',
      DB_PASSWORD: process.env.DB_PASSWORD,
      DB_POOL_MIN: 2,
      DB_POOL_MAX: 10
    }
  }]
};
```

### MongoDB

```typescript
export default {
  apps: [{
    name: 'myapp',
    script: './dist/index.js',
    instances: 4,
    exec_mode: 'cluster',
    env: {
      MONGODB_URI: 'mongodb://mongo1,mongo2,mongo3/myapp?replicaSet=rs0',
      MONGODB_OPTIONS: JSON.stringify({
        useNewUrlParser: true,
        useUnifiedTopology: true,
        poolSize: 10
      })
    }
  }]
};
```

### Redis

```typescript
export default {
  apps: [{
    name: 'myapp',
    script: './dist/index.js',
    instances: 4,
    exec_mode: 'cluster',
    env: {
      REDIS_HOST: 'redis.internal',
      REDIS_PORT: 6379,
      REDIS_PASSWORD: process.env.REDIS_PASSWORD,
      REDIS_DB: 0,
      REDIS_MAX_RETRIES: 3
    }
  }]
};
```

## Message Queue Integration

### RabbitMQ

```typescript
export default {
  apps: [
    {
      name: 'api',
      script: './dist/api.js',
      instances: 4,
      exec_mode: 'cluster',
      env: {
        RABBITMQ_URL: 'amqp://rabbitmq.internal:5672',
        RABBITMQ_EXCHANGE: 'myapp-exchange',
        RABBITMQ_QUEUE: 'api-queue'
      }
    },
    {
      name: 'worker',
      script: './dist/worker.js',
      instances: 2,
      exec_mode: 'fork',
      env: {
        RABBITMQ_URL: 'amqp://rabbitmq.internal:5672',
        RABBITMQ_EXCHANGE: 'myapp-exchange',
        RABBITMQ_QUEUE: 'worker-queue'
      }
    }
  ]
};
```

### Apache Kafka

```typescript
export default {
  apps: [{
    name: 'kafka-consumer',
    script: './dist/consumer.js',
    instances: 3,
    exec_mode: 'fork',
    env: {
      KAFKA_BROKERS: 'kafka1:9092,kafka2:9092,kafka3:9092',
      KAFKA_GROUP_ID: 'myapp-consumer-group',
      KAFKA_TOPICS: 'events,notifications',
      KAFKA_AUTO_COMMIT: 'true'
    }
  }]
};
```

### AWS SQS

```typescript
export default {
  apps: [{
    name: 'sqs-worker',
    script: './dist/worker.js',
    instances: 4,
    exec_mode: 'fork',
    env: {
      AWS_REGION: 'us-east-1',
      SQS_QUEUE_URL: process.env.SQS_QUEUE_URL,
      SQS_MAX_MESSAGES: '10',
      SQS_WAIT_TIME: '20'
    }
  }]
};
```

## Best Practices

1. **Always use `--no-daemon` in containers**
2. **Set memory limits to prevent OOM**
3. **Use health checks in production**
4. **Enable graceful shutdowns**
5. **Configure proper logging**
6. **Use environment variables for configuration**
7. **Implement proper error handling**
8. **Monitor process metrics**
9. **Set up alerts for failures**
10. **Test deployments in staging first**

## Troubleshooting

### Logs not appearing

Check log file permissions and paths in your ecosystem config.

### Processes not restarting

Verify autorestart is enabled and check max_restarts limit.

### High memory usage

Set max_memory_restart in your configuration.

### Port conflicts in cluster mode

Ensure your application properly handles cluster mode port sharing.

## Additional Resources

- [PM2 Clone Documentation](../README.md)
- [Examples](../examples/)
- [API Reference](./API.md)
