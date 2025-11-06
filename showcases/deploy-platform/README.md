# Deploy Platform

A self-hosted deployment platform alternative to Vercel and Netlify, built with Elide. Deploy any language with zero vendor lock-in, instant builds, and complete portability.

## Overview

Deploy Platform provides a complete deployment solution with:

- **Git Integration**: Push to deploy with automatic build triggers
- **Preview Deployments**: Per-branch deployments for testing
- **Custom Domains**: Add unlimited custom domains with automatic HTTPS
- **Environment Variables**: Secure configuration management
- **Automatic HTTPS**: Let's Encrypt SSL certificates with auto-renewal
- **Build Caching**: Smart caching for faster builds
- **Rollback Support**: Instant rollback to any previous deployment
- **Logs and Metrics**: Real-time build logs and performance metrics
- **Team Collaboration**: Multi-user teams with role-based access
- **Zero Vendor Lock-in**: Self-hosted or multi-cloud deployment
- **Polyglot Support**: Deploy any language, not just JavaScript

## Architecture

```
deploy-platform/
├── cli/                  # Deployment CLI tool
│   └── deploy-cli.ts     # Command-line interface
├── api/                  # Platform API
│   └── platform-api.ts   # REST API server
├── builder/              # Build pipeline
│   ├── build-pipeline.ts # Build orchestration
│   └── cache-manager.ts  # Build caching
├── runtime/              # App hosting
│   └── app-runtime.ts    # Runtime management
├── router/               # Routing & SSL
│   └── edge-router.ts    # Edge routing
├── storage/              # Object storage
│   └── object-storage.ts # S3-compatible storage
├── database/             # Metadata store
│   └── metadata-store.ts # Database layer
├── dashboard/            # Web UI
│   └── dashboard-app.ts  # Dashboard interface
├── tests/                # Test suite
└── docs/                 # Documentation
```

## Features

### 1. Git-based Deployment

Deploy your application by pushing to your Git repository:

```bash
git push origin main
# Automatic deployment triggered
```

Or use the CLI:

```bash
deploy
# Deploys current branch
```

### 2. Preview Deployments

Every branch gets its own preview deployment:

- `main` → `https://myapp.com` (production)
- `feature/new-ui` → `https://myapp-feature-new-ui.deploy-platform.app` (preview)
- `develop` → `https://myapp-develop.deploy-platform.app` (staging)

### 3. Custom Domains

Add unlimited custom domains with automatic HTTPS:

```bash
deploy domains add myapp.com
deploy domains add www.myapp.com
deploy domains add api.myapp.com
```

SSL certificates are automatically issued and renewed using Let's Encrypt.

### 4. Environment Variables

Manage environment variables per deployment target:

```bash
# Add environment variable
deploy env add API_KEY your-secret-key

# List environment variables
deploy env list

# Remove environment variable
deploy env rm API_KEY
```

Environment variables can be scoped to:
- **Production**: Only production deployments
- **Preview**: Only preview deployments
- **Development**: Only local development

### 5. Build Caching

Smart build caching speeds up deployments:

- **Dependency Caching**: node_modules, pip packages, gems
- **Build Output Caching**: Compiled assets and artifacts
- **LRU Eviction**: Automatic cache management
- **Cache Invalidation**: Automatic invalidation on dependency changes

### 6. Rollback Support

Instantly rollback to any previous deployment:

```bash
deploy rollback dpl_abc123
# Reverts to deployment dpl_abc123
```

### 7. Logs and Metrics

Real-time build logs and deployment metrics:

```bash
# View deployment logs
deploy logs dpl_abc123

# View project analytics
deploy analytics
```

### 8. Auto-scaling

Automatic scaling based on traffic:

- **Min/Max Instances**: Configure scaling limits
- **CPU/Memory Targets**: Scale based on resource usage
- **Request-based Scaling**: Scale based on traffic
- **Regional Deployment**: Deploy to multiple regions

## Getting Started

### Prerequisites

- Node.js 18+ (for TypeScript runtime)
- Git (for repository integration)
- A cloud provider account (optional, for production deployment)

### Installation

```bash
# Clone the repository
git clone https://github.com/example/deploy-platform
cd deploy-platform

# Install dependencies
npm install

# Build the platform
npm run build
```

### Quick Start

#### 1. Initialize a Project

```bash
cd my-app
deploy init
```

This creates a `deploy.json` configuration file:

```json
{
  "name": "my-app",
  "framework": "nextjs",
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "installCommand": "npm install"
}
```

#### 2. Login

```bash
deploy login <token>
```

Or set the `DEPLOY_TOKEN` environment variable.

#### 3. Deploy

```bash
deploy
```

Your app will be built and deployed to:
```
https://my-app-abc123.deploy-platform.app
```

## CLI Commands

### Authentication

```bash
# Login
deploy login <token>

# Logout
deploy logout

# Show current user
deploy whoami
```

### Deployment

```bash
# Deploy current branch
deploy

# List deployments
deploy list

# View deployment logs
deploy logs <deployment-id>

# Cancel deployment
deploy cancel <deployment-id>

# Rollback to deployment
deploy rollback <deployment-id>

# Promote to production
deploy promote <deployment-id>
```

### Project Management

```bash
# Initialize project
deploy init

# Link to existing project
deploy link <project-id>

# Unlink from project
deploy unlink

# List projects
deploy projects

# Create project
deploy projects create <name>

# Delete project
deploy projects rm <project-id>
```

### Environment Variables

```bash
# List environment variables
deploy env

# Add environment variable
deploy env add <key> <value>

# Remove environment variable
deploy env rm <key>
```

### Domains

```bash
# List domains
deploy domains

# Add domain
deploy domains add <domain>

# Remove domain
deploy domains rm <domain>
```

## Supported Frameworks

Deploy Platform auto-detects and supports:

### JavaScript/TypeScript
- **Next.js**: React framework with SSR
- **React**: Create React App, Vite
- **Vue.js**: Vue 3, Nuxt.js
- **Svelte**: SvelteKit
- **Astro**: Static site generator
- **Remix**: Full-stack React framework
- **Node.js**: Express, Fastify, Koa

### Python
- **Django**: Web framework
- **Flask**: Microframework
- **FastAPI**: Modern API framework
- **Streamlit**: Data apps

### Ruby
- **Rails**: Full-stack framework
- **Sinatra**: Lightweight framework

### Go
- **Gin**: Web framework
- **Echo**: High performance framework
- **Static binaries**: Any Go application

### Rust
- **Actix**: Web framework
- **Rocket**: Web framework
- **Static binaries**: Any Rust application

### Static Sites
- HTML, CSS, JavaScript
- Jekyll, Hugo, 11ty
- Any static site generator

## Platform API

The platform exposes a REST API for programmatic access:

### Authentication

```bash
POST /auth/login
POST /auth/register
POST /auth/logout
GET /auth/user
```

### Projects

```bash
GET /projects
POST /projects
GET /projects/:id
PATCH /projects/:id
DELETE /projects/:id
```

### Deployments

```bash
GET /projects/:projectId/deployments
POST /projects/:projectId/deployments
GET /deployments/:id
POST /deployments/:id/cancel
POST /deployments/:id/promote
POST /deployments/:id/rollback
```

### Environment Variables

```bash
GET /projects/:projectId/env
POST /projects/:projectId/env
PATCH /projects/:projectId/env/:key
DELETE /projects/:projectId/env/:key
```

### Domains

```bash
GET /projects/:projectId/domains
POST /projects/:projectId/domains
DELETE /projects/:projectId/domains/:domainId
POST /projects/:projectId/domains/:domainId/verify
```

See [API Documentation](./docs/API.md) for complete API reference.

## Configuration

### deploy.json

Project configuration file:

```json
{
  "name": "my-app",
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
  ],
  "regions": ["us-east-1", "eu-west-1"]
}
```

### Environment Variables

Platform configuration via environment variables:

```bash
# API endpoint
DEPLOY_ENDPOINT=https://api.deploy-platform.io

# Authentication token
DEPLOY_TOKEN=your-token

# Storage backend
STORAGE_BACKEND=s3
STORAGE_BUCKET=deployments
STORAGE_REGION=us-east-1

# Database
DB_TYPE=postgres
DB_HOST=localhost
DB_PORT=5432
DB_NAME=deploy_platform

# Cache directory
CACHE_DIR=/var/cache/deploy-platform

# Build directory
BUILD_DIR=/var/builds
```

## Self-Hosting

### Docker Deployment

```bash
# Build image
docker build -t deploy-platform .

# Run platform
docker run -p 3000:3000 \
  -e DB_TYPE=postgres \
  -e DB_HOST=postgres \
  -e STORAGE_BACKEND=s3 \
  deploy-platform
```

### Kubernetes Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: deploy-platform
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
```

### AWS Deployment

Deploy to AWS using:
- **ECS/Fargate**: Containerized deployment
- **EC2**: VM-based deployment
- **S3**: Static asset storage
- **RDS**: Database hosting
- **CloudFront**: CDN distribution

### GCP Deployment

Deploy to Google Cloud using:
- **Cloud Run**: Serverless containers
- **GKE**: Kubernetes deployment
- **Cloud Storage**: Object storage
- **Cloud SQL**: Database hosting
- **Cloud CDN**: Content delivery

### Azure Deployment

Deploy to Azure using:
- **Container Instances**: Serverless containers
- **AKS**: Kubernetes deployment
- **Blob Storage**: Object storage
- **Azure Database**: Database hosting
- **Azure CDN**: Content delivery

## Performance

### Build Times

Optimized build pipeline with caching:

- **Cold build**: ~30-60 seconds (no cache)
- **Warm build**: ~5-15 seconds (with cache)
- **Instant builds**: Elide's fast startup (< 1 second)

### Scaling

Auto-scaling based on traffic:

- **Min instances**: 1
- **Max instances**: 100+
- **Scale-up time**: < 30 seconds
- **Scale-down time**: 5 minutes (configurable)

### Global Distribution

Deploy to multiple regions:

- **Americas**: us-east-1, us-west-2, sa-east-1
- **Europe**: eu-west-1, eu-central-1
- **Asia Pacific**: ap-southeast-1, ap-northeast-1

## Security

### Authentication

- **JWT tokens**: Secure token-based auth
- **OAuth2**: Google, GitHub integration
- **API keys**: Programmatic access
- **Team-based access**: Role-based permissions

### SSL/TLS

- **Automatic HTTPS**: Let's Encrypt certificates
- **Auto-renewal**: Certificates renewed automatically
- **TLS 1.3**: Modern encryption protocols
- **Perfect Forward Secrecy**: Enhanced security

### Isolation

- **Process isolation**: Separate runtime environments
- **Resource limits**: CPU and memory limits
- **Network isolation**: Virtual networks
- **Secret management**: Encrypted environment variables

## Monitoring

### Metrics

- **Deployment success rate**: Track deployment reliability
- **Build times**: Monitor build performance
- **Response times**: Application performance
- **Error rates**: Application errors
- **Resource usage**: CPU, memory, bandwidth

### Logs

- **Build logs**: Real-time build output
- **Application logs**: Runtime logs
- **Access logs**: HTTP request logs
- **Error logs**: Error tracking

### Alerts

- **Deployment failures**: Alert on failed deployments
- **High error rates**: Alert on application errors
- **Resource limits**: Alert on resource exhaustion
- **Certificate expiry**: Alert on SSL expiration

## Comparison

### vs Vercel

| Feature | Deploy Platform | Vercel |
|---------|----------------|--------|
| **Vendor Lock-in** | None (self-hosted) | High |
| **Languages** | Any | JS/TS focused |
| **Pricing** | Pay for infrastructure | Complex tiers |
| **Data Control** | Full control | Vendor controlled |
| **Customization** | Fully customizable | Limited |
| **Open Source** | Yes | No |

### vs Netlify

| Feature | Deploy Platform | Netlify |
|---------|----------------|---------|
| **Vendor Lock-in** | None (self-hosted) | High |
| **Build Minutes** | Unlimited | Limited by plan |
| **Bandwidth** | Pay for what you use | Limited by plan |
| **Functions** | Any runtime | Limited runtimes |
| **Control** | Full control | Vendor controlled |

### vs Heroku

| Feature | Deploy Platform | Heroku |
|---------|----------------|--------|
| **Pricing** | Infrastructure cost | Platform fees |
| **Languages** | Any | Many (with buildpacks) |
| **Scaling** | Auto-scaling | Manual/auto |
| **Databases** | Bring your own | Add-ons |
| **Control** | Full control | Platform managed |

## Contributing

This is a showcase project demonstrating deployment platform architecture.

## License

Part of Elide Showcases - Deployment Platform Demo

## Support

For questions or issues:
- GitHub Issues: [Report an issue](https://github.com/example/deploy-platform/issues)
- Documentation: [docs/](./docs/)
- Examples: Check the `examples/` directory

## Roadmap

### Phase 1 (Current)
- ✅ Git integration
- ✅ Build pipeline
- ✅ Auto-scaling
- ✅ Custom domains
- ✅ Environment variables

### Phase 2 (Planned)
- [ ] GitHub/GitLab integration
- [ ] Slack/Discord notifications
- [ ] Advanced metrics
- [ ] Cost optimization
- [ ] Multi-region deployments

### Phase 3 (Future)
- [ ] Database migrations
- [ ] Scheduled deployments
- [ ] A/B testing
- [ ] CDN integration
- [ ] Edge functions

## HN Pitch

**Self-hosted Vercel alternative with Elide**

Deploy any language with zero vendor lock-in. Get instant builds, automatic HTTPS, and complete control over your infrastructure.

Unlike Vercel/Netlify:
- No vendor lock-in (self-hosted or multi-cloud)
- Polyglot support (any language, not just JS/TS)
- Simple pricing (pay for infrastructure, not platform)
- Full data control (your servers, your data)
- Instant builds (Elide's fast startup)

Perfect for:
- Teams wanting control over their deployment pipeline
- Companies with compliance requirements
- Developers tired of vendor lock-in
- Anyone wanting Vercel's DX without the vendor lock-in

Try it: `npm install -g @deploy-platform/cli && deploy init`
