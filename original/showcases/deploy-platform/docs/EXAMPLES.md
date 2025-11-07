# Deploy Platform - Examples

Practical examples for deploying different types of applications.

## Table of Contents

- [Next.js Application](#nextjs-application)
- [React Application](#react-application)
- [Node.js API](#nodejs-api)
- [Python Flask App](#python-flask-app)
- [Go Application](#go-application)
- [Static Website](#static-website)
- [Monorepo](#monorepo)
- [Docker Application](#docker-application)

## Next.js Application

### Project Structure

```
my-nextjs-app/
├── pages/
│   ├── index.tsx
│   └── api/
│       └── hello.ts
├── public/
├── package.json
└── deploy.json
```

### deploy.json

```json
{
  "name": "my-nextjs-app",
  "framework": "nextjs",
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "installCommand": "npm install",
  "devCommand": "npm run dev",
  "env": {
    "NODE_ENV": "production"
  },
  "routes": [
    {
      "src": "/api/.*",
      "dest": "/api/index.js"
    }
  ]
}
```

### Deployment

```bash
# Initialize project
cd my-nextjs-app
deploy init

# Deploy
deploy

# Add environment variables
deploy env add DATABASE_URL postgresql://...
deploy env add API_KEY secret-key

# Add custom domain
deploy domains add myapp.com
```

## React Application

### Project Structure

```
my-react-app/
├── src/
│   ├── App.tsx
│   └── index.tsx
├── public/
├── package.json
└── deploy.json
```

### deploy.json

```json
{
  "name": "my-react-app",
  "framework": "react",
  "buildCommand": "npm run build",
  "outputDirectory": "build",
  "installCommand": "npm install",
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ]
}
```

### Deployment

```bash
# Deploy with preview
git checkout -b feature/new-ui
git push origin feature/new-ui
# Preview URL: https://my-react-app-feature-new-ui.deploy-platform.app

# Deploy to production
git checkout main
git merge feature/new-ui
git push origin main
# Production URL: https://myapp.com
```

## Node.js API

### Project Structure

```
my-api/
├── src/
│   ├── index.ts
│   └── routes/
│       ├── users.ts
│       └── posts.ts
├── package.json
└── deploy.json
```

### deploy.json

```json
{
  "name": "my-api",
  "framework": "nodejs",
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "installCommand": "npm install",
  "devCommand": "npm run dev",
  "env": {
    "NODE_ENV": "production",
    "PORT": "8080"
  }
}
```

### Environment Variables

```bash
# Production
deploy env add DATABASE_URL postgresql://prod-db/myapp
deploy env add REDIS_URL redis://prod-redis:6379

# Preview
deploy env add DATABASE_URL postgresql://preview-db/myapp --target preview
deploy env add REDIS_URL redis://preview-redis:6379 --target preview
```

### Deployment

```bash
# Deploy API
deploy

# View logs
deploy logs dpl_abc123

# Check health
curl https://my-api.deploy-platform.app/health
```

## Python Flask App

### Project Structure

```
my-flask-app/
├── app.py
├── requirements.txt
├── Procfile
└── deploy.json
```

### app.py

```python
from flask import Flask

app = Flask(__name__)

@app.route('/')
def hello():
    return 'Hello from Flask!'

if __name__ == '__main__':
    app.run()
```

### requirements.txt

```
flask==2.3.0
gunicorn==21.2.0
```

### Procfile

```
web: gunicorn app:app
```

### deploy.json

```json
{
  "name": "my-flask-app",
  "framework": "python",
  "buildCommand": "pip install -r requirements.txt",
  "installCommand": "pip install -r requirements.txt",
  "devCommand": "python app.py"
}
```

### Deployment

```bash
# Deploy Flask app
deploy

# Add environment variables
deploy env add FLASK_ENV production
deploy env add SECRET_KEY your-secret-key

# Scale instances
deploy scale --min 2 --max 10
```

## Go Application

### Project Structure

```
my-go-app/
├── main.go
├── go.mod
├── go.sum
└── deploy.json
```

### main.go

```go
package main

import (
    "fmt"
    "net/http"
)

func main() {
    http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
        fmt.Fprintf(w, "Hello from Go!")
    })

    http.ListenAndServe(":8080", nil)
}
```

### deploy.json

```json
{
  "name": "my-go-app",
  "framework": "go",
  "buildCommand": "go build -o app",
  "installCommand": "go mod download",
  "env": {
    "PORT": "8080"
  }
}
```

### Deployment

```bash
# Deploy Go app
deploy

# View deployment info
deploy list

# Promote to production
deploy promote dpl_abc123
```

## Static Website

### Project Structure

```
my-website/
├── index.html
├── css/
│   └── style.css
├── js/
│   └── app.js
└── deploy.json
```

### deploy.json

```json
{
  "name": "my-website",
  "outputDirectory": ".",
  "routes": [
    {
      "src": "/(.*)",
      "headers": {
        "Cache-Control": "public, max-age=3600"
      }
    }
  ]
}
```

### Deployment

```bash
# Deploy static site
deploy

# Add custom domain
deploy domains add mywebsite.com
deploy domains add www.mywebsite.com

# Configure DNS
# CNAME mywebsite.com -> cname.deploy-platform.io
# CNAME www.mywebsite.com -> cname.deploy-platform.io
```

## Monorepo

### Project Structure

```
my-monorepo/
├── apps/
│   ├── web/
│   │   ├── package.json
│   │   └── deploy.json
│   └── api/
│       ├── package.json
│       └── deploy.json
└── packages/
    └── shared/
```

### apps/web/deploy.json

```json
{
  "name": "my-monorepo-web",
  "framework": "nextjs",
  "rootDirectory": "apps/web",
  "buildCommand": "npm run build",
  "installCommand": "npm install",
  "outputDirectory": ".next"
}
```

### apps/api/deploy.json

```json
{
  "name": "my-monorepo-api",
  "framework": "nodejs",
  "rootDirectory": "apps/api",
  "buildCommand": "npm run build",
  "installCommand": "npm install",
  "outputDirectory": "dist"
}
```

### Deployment

```bash
# Deploy web app
cd apps/web
deploy

# Deploy API
cd apps/api
deploy

# Link projects
deploy link prj_web123
deploy link prj_api456
```

## Docker Application

### Project Structure

```
my-docker-app/
├── Dockerfile
├── src/
│   └── index.js
├── package.json
└── deploy.json
```

### Dockerfile

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --production

COPY . .

EXPOSE 3000

CMD ["node", "src/index.js"]
```

### deploy.json

```json
{
  "name": "my-docker-app",
  "framework": "docker",
  "buildCommand": "docker build -t my-app .",
  "env": {
    "PORT": "3000"
  }
}
```

### Deployment

```bash
# Deploy Docker app
deploy

# Configure resources
deploy scale --memory 512 --cpu 1

# View logs
deploy logs dpl_abc123 --follow
```

## Advanced Configurations

### Custom Headers

```json
{
  "routes": [
    {
      "src": "/(.*)",
      "headers": {
        "X-Frame-Options": "DENY",
        "X-Content-Type-Options": "nosniff",
        "Referrer-Policy": "strict-origin-when-cross-origin"
      }
    }
  ]
}
```

### Redirects

```json
{
  "routes": [
    {
      "src": "/old-page",
      "status": 301,
      "headers": {
        "Location": "/new-page"
      }
    },
    {
      "src": "/blog/(.*)",
      "status": 302,
      "headers": {
        "Location": "https://blog.example.com/$1"
      }
    }
  ]
}
```

### Rewrites

```json
{
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/api/index.php?path=$1"
    },
    {
      "src": "/users/([^/]+)",
      "dest": "/api/users?id=$1"
    }
  ]
}
```

### CORS Configuration

```json
{
  "routes": [
    {
      "src": "/api/(.*)",
      "headers": {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization"
      }
    }
  ]
}
```

### Environment-Specific Config

```json
{
  "name": "my-app",
  "env": {
    "API_URL": "https://api.example.com",
    "DEBUG": "false"
  },
  "preview": {
    "env": {
      "API_URL": "https://staging-api.example.com",
      "DEBUG": "true"
    }
  }
}
```

### Multi-Region Deployment

```json
{
  "name": "my-app",
  "regions": [
    "us-east-1",
    "us-west-2",
    "eu-west-1",
    "ap-southeast-1"
  ]
}
```

### Cron Jobs

```json
{
  "name": "my-app",
  "crons": [
    {
      "name": "daily-cleanup",
      "schedule": "0 0 * * *",
      "path": "/api/cron/cleanup"
    },
    {
      "name": "hourly-sync",
      "schedule": "0 * * * *",
      "path": "/api/cron/sync"
    }
  ]
}
```

## CI/CD Integration

### GitHub Actions

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Install Deploy CLI
        run: npm install -g @deploy-platform/cli

      - name: Deploy
        env:
          DEPLOY_TOKEN: ${{ secrets.DEPLOY_TOKEN }}
        run: deploy
```

### GitLab CI

```yaml
deploy:
  stage: deploy
  script:
    - npm install -g @deploy-platform/cli
    - deploy
  only:
    - main
  variables:
    DEPLOY_TOKEN: $DEPLOY_TOKEN
```

### Bitbucket Pipelines

```yaml
pipelines:
  branches:
    main:
      - step:
          name: Deploy
          script:
            - npm install -g @deploy-platform/cli
            - deploy
          environment:
            DEPLOY_TOKEN: $DEPLOY_TOKEN
```

## Troubleshooting

### Build Failures

```bash
# View build logs
deploy logs dpl_abc123

# Retry build
deploy deploy --no-cache

# Check build configuration
cat deploy.json
```

### Deployment Issues

```bash
# Check deployment status
deploy list

# Rollback to previous version
deploy rollback dpl_previous123

# Cancel current deployment
deploy cancel dpl_abc123
```

### Performance Issues

```bash
# View metrics
deploy analytics

# Scale up
deploy scale --min 3 --max 20

# Check resource usage
deploy stats
```

## Best Practices

### 1. Use Environment Variables

Never hardcode secrets:

```bash
# Wrong
const API_KEY = 'secret-key';

# Right
const API_KEY = process.env.API_KEY;
```

### 2. Optimize Build Times

Enable caching:

```json
{
  "buildCommand": "npm run build",
  "cache": {
    "paths": ["node_modules", ".next/cache"]
  }
}
```

### 3. Use Preview Deployments

Test changes before production:

```bash
# Create feature branch
git checkout -b feature/new-feature

# Deploy to preview
git push origin feature/new-feature

# Test: https://my-app-feature-new-feature.deploy-platform.app

# Merge to production
git checkout main
git merge feature/new-feature
git push origin main
```

### 4. Monitor Deployments

Set up alerts:

```bash
# Configure alerts
deploy alerts add --type deployment-failure
deploy alerts add --type high-error-rate
```

### 5. Regular Cleanup

Remove old deployments:

```bash
# Delete deployment
deploy delete dpl_old123

# Cleanup old deployments
deploy cleanup --days 30
```
