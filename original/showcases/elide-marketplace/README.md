# Elide Marketplace Platform

A complete marketplace platform for Elide packages and services. This showcase demonstrates enterprise-grade marketplace architecture with package registry, service marketplace, billing integration, and comprehensive tooling.

## Overview

The Elide Marketplace Platform provides:

- **📦 Package Registry**: npm-compatible package registry with security scanning and quality scoring
- **🛍️ Service Marketplace**: Deploy and manage Database-as-a-Service, ML models, APIs, and more
- **🔐 Authentication**: JWT-based authentication with API tokens and role-based access control
- **📊 Analytics**: Comprehensive usage tracking and billing analytics
- **🌐 Web Dashboard**: Beautiful web interface for browsing and managing resources
- **🛠️ CLI Tools**: Command-line tools for publishing packages and managing deployments
- **🚀 Service Orchestration**: Automated provisioning and lifecycle management
- **💰 Billing Integration**: Usage tracking and cost projection

## Architecture

```
elide-marketplace/
├── server.ts                     # Main API server (3000)
├── registry/
│   ├── registry-server.ts        # npm-compatible registry (4873)
│   ├── package-scorer.ts         # Quality, popularity, maintenance scoring
│   └── security-scanner.ts       # Dependency vulnerability scanning
├── marketplace/
│   ├── marketplace-server.ts     # Service marketplace API (3001)
│   └── service-provisioner.ts    # Service deployment orchestration
├── client/
│   ├── publish-cli.ts            # Package publishing CLI
│   └── service-cli.ts            # Service management CLI
├── dashboard/
│   └── dashboard-server.ts       # Web UI (8080)
├── services/
│   └── service-orchestrator.ts   # Service lifecycle management (3002)
├── scripts/
│   └── seed-data.ts              # Database seeding
└── package.json
```

## Features

### Package Registry

#### npm-Compatible API

The registry implements the npm registry protocol, making it compatible with standard npm workflows:

```bash
# Configure npm to use Elide registry
npm config set registry http://localhost:4873/npm/

# Publish packages
npm publish

# Install packages
npm install @elide/http
```

#### Multi-Language Support

- **TypeScript/JavaScript**: Full npm compatibility
- **Python**: PyPI-compatible package uploads
- **Java**: Maven artifact deployment
- **Ruby**: RubyGems integration

#### Package Quality Scoring

Packages are scored across three dimensions (similar to npms.io):

1. **Quality Score** (30% weight)
   - Code coverage
   - Tests presence
   - TypeScript types
   - Linting setup
   - Documentation quality

2. **Popularity Score** (40% weight)
   - Download counts
   - Download growth
   - GitHub stars
   - Number of dependents

3. **Maintenance Score** (30% weight)
   - Release frequency
   - Commit frequency
   - Issue management
   - Update recency

#### Security Scanning

Automated vulnerability scanning includes:

- Known CVE database checking
- Dependency tree analysis
- Malicious code pattern detection
- Typosquatting detection
- License compliance checking

### Service Marketplace

#### Available Services

**Database-as-a-Service**

- PostgreSQL Managed
- MongoDB Managed
- Redis Cache
- MySQL Managed

**ML-Model-as-a-Service**

- TensorFlow Serving
- PyTorch Inference
- ONNX Runtime
- Custom Model Hosting

**API-as-a-Service**

- REST API Gateway
- GraphQL Proxy
- WebSocket Gateway

**Storage-as-a-Service**

- S3-Compatible Object Storage
- CDN with edge caching
- File storage with versioning

**Compute-as-a-Service**

- Serverless Functions
- Container Hosting
- Cron Jobs

#### Service Features

- **Automated Provisioning**: Deploy services in seconds
- **Multi-Region Support**: Deploy to US, EU, and Asia regions
- **Flexible Pricing**: Free, pay-as-you-go, and subscription tiers
- **Health Monitoring**: Real-time service health checks
- **Metrics & Logging**: Built-in observability
- **Auto-Scaling**: Scale based on demand
- **Backup & Recovery**: Automated backups and point-in-time recovery

### Authentication & Authorization

```typescript
// Register new user
POST /api/auth/register
{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "secure_password"
}

// Response includes API token
{
  "userId": "user-123",
  "username": "johndoe",
  "token": "elk_abcd1234..."
}

// Use token for authenticated requests
Authorization: Bearer elk_abcd1234...
```

**User Roles**:
- `user`: Basic marketplace access
- `publisher`: Can publish packages
- `admin`: Full platform access

### Analytics & Billing

#### Usage Tracking

Track all marketplace activity:

```typescript
GET /api/analytics?type=package&id=pkg-123&days=30

{
  "period": "30 days",
  "analytics": [
    {
      "date": "2024-01-01",
      "event_type": "downloaded",
      "count": 1523
    }
  ]
}
```

#### Cost Projection

Real-time cost tracking and projection:

```typescript
GET /api/deployments/{id}

{
  "billing": {
    "currentCost": 9.50,
    "projectedCost": 19.00,
    "currency": "USD",
    "billingCycle": "monthly"
  }
}
```

### Webhooks

Subscribe to marketplace events:

```typescript
POST /api/webhooks
{
  "url": "https://your-app.com/webhook",
  "events": [
    "package.published",
    "service.deployed",
    "deployment.failed"
  ]
}
```

Supported events:
- `package.published` - New package version published
- `package.deprecated` - Package marked as deprecated
- `service.deployed` - Service deployment created
- `service.failed` - Deployment failed
- `deployment.started` - Deployment started
- `deployment.stopped` - Deployment stopped
- `billing.threshold` - Cost threshold reached

## Getting Started

### Prerequisites

- Elide Runtime (v0.11.0-beta11-rc1 or later)
- Node.js 18+ (for development)

### Installation

```bash
cd elide-marketplace

# Seed the database
elide run scripts/seed-data.ts

# Start all services
elide run server.ts              # Main API (port 3000)
elide run registry/registry-server.ts  # Registry (port 4873)
elide run marketplace/marketplace-server.ts  # Marketplace (port 3001)
elide run dashboard/dashboard-server.ts  # Dashboard (port 8080)
elide run services/service-orchestrator.ts  # Orchestrator (port 3002)
```

### Quick Start

1. **Browse the Dashboard**

```bash
open http://localhost:8080
```

2. **Use the CLI**

```bash
# Install CLI tools
chmod +x client/*.ts

# Login
./client/publish-cli.ts login
# Username: demo
# Password: demo123

# Search packages
./client/publish-cli.ts search elide

# Publish package
./client/publish-cli.ts publish ./my-package

# List services
./client/service-cli.ts list

# Deploy a service
./client/service-cli.ts deploy postgres-managed
```

3. **API Examples**

```bash
# Search packages
curl http://localhost:3000/api/packages/search?q=elide

# Get package details
curl http://localhost:3000/api/packages/@elide/http

# List services
curl http://localhost:3001/api/services

# Deploy service (requires auth)
curl -X POST http://localhost:3001/api/deployments \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "serviceId": "svc-postgres",
    "name": "my-database",
    "config": {
      "tier": "starter",
      "region": "us-east-1"
    }
  }'
```

## Publishing Packages

### TypeScript/JavaScript Package

```bash
# 1. Create package
mkdir my-awesome-package
cd my-awesome-package

# 2. Initialize package.json
cat > package.json << EOF
{
  "name": "@myorg/awesome-package",
  "version": "1.0.0",
  "description": "An awesome Elide package",
  "main": "index.ts",
  "keywords": ["elide", "awesome"],
  "license": "MIT"
}
EOF

# 3. Create main file
cat > index.ts << EOF
export function greet(name: string): string {
  return \`Hello, \${name}!\`;
}
EOF

# 4. Login to marketplace
elide run ../client/publish-cli.ts login

# 5. Publish
elide run ../client/publish-cli.ts publish
```

### Python Package

```bash
# Create setup.py
cat > setup.py << EOF
from setuptools import setup

setup(
    name='my-python-package',
    version='1.0.0',
    description='Python package for Elide',
    py_modules=['my_package']
)
EOF

# Publish using CLI
elide run ../client/publish-cli.ts publish
```

### Maven Package

```xml
<!-- Configure pom.xml -->
<distributionManagement>
  <repository>
    <id>elide-marketplace</id>
    <url>http://localhost:4873/maven2</url>
  </repository>
</distributionManagement>

<!-- Deploy -->
mvn deploy
```

## Deploying Services

### Deploy Database

```bash
# Using CLI
elide run client/service-cli.ts deploy postgres-managed

# Using API
curl -X POST http://localhost:3001/api/deployments \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "serviceId": "svc-postgres",
    "name": "production-db",
    "config": {
      "tier": "pro",
      "region": "us-east-1"
    }
  }'
```

Response includes connection credentials:

```json
{
  "deploymentId": "deploy-abc123",
  "name": "production-db",
  "status": "provisioning",
  "endpoint": "deploy-abc123.db.elide.services:5432",
  "credentials": {
    "host": "deploy-abc123.db.elide.services",
    "port": "5432",
    "database": "defaultdb",
    "username": "user_abc123",
    "password": "securepassword",
    "connectionString": "postgresql://user_abc123:securepassword@deploy-abc123.db.elide.services:5432/defaultdb"
  }
}
```

### Deploy ML Model

```bash
elide run client/service-cli.ts deploy ml-inference

# Configure model
{
  "tier": "gpu",
  "region": "us-west-2",
  "model": {
    "framework": "tensorflow",
    "version": "2.13",
    "modelPath": "s3://my-models/sentiment-model.pb"
  }
}
```

### Monitor Deployment

```bash
# Get deployment status
elide run client/service-cli.ts status deploy-abc123

# Output:
# Deployment: production-db
# Status: running
# Metrics:
#   Requests: 125,432
#   Errors: 12
#   Avg Response Time: 23ms
#   Uptime: 99.95%
# Billing:
#   Current Cost: $47.50
#   Projected Cost: $95.00
```

## Marketplace Business Model

### Revenue Streams

1. **Service Marketplace Fees**
   - Transaction fee: 10% on paid services
   - Premium listings: $99/month
   - Featured placement: $299/month

2. **Package Registry**
   - Private registries: $29/month for teams
   - Enterprise registries: Custom pricing
   - Storage fees: $0.10/GB/month

3. **Value-Added Services**
   - Priority support: $199/month
   - SLA guarantees: Custom pricing
   - Dedicated infrastructure: Custom pricing

4. **Service Provisioning**
   - Commission on service deployments
   - Premium tier features
   - Enterprise support plans

### Pricing Tiers

**Free Tier**
- Public package publishing
- Community support
- Basic analytics
- 1 active deployment

**Team Tier** ($49/month)
- Private packages
- 10 active deployments
- Email support
- Advanced analytics
- Webhook support

**Enterprise Tier** (Custom)
- Unlimited packages
- Unlimited deployments
- 24/7 phone support
- Custom SLAs
- Dedicated account manager
- On-premise deployment

## API Documentation

### Package Registry API

#### Publish Package

```http
POST /api/packages
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "@scope/package-name",
  "version": "1.0.0",
  "description": "Package description",
  "tarball": "https://cdn.example.com/package.tgz",
  "dependencies": {
    "other-package": "^1.0.0"
  },
  "license": "MIT"
}
```

#### Search Packages

```http
GET /api/packages/search?q={query}&limit=20&offset=0

Response:
{
  "results": [
    {
      "id": "pkg-123",
      "name": "@elide/http",
      "description": "HTTP server and client",
      "downloads": 150000,
      "score": 0.92
    }
  ],
  "total": 42,
  "limit": 20,
  "offset": 0
}
```

#### Get Package Details

```http
GET /api/packages/{name}

Response:
{
  "id": "pkg-123",
  "name": "@elide/http",
  "description": "HTTP server and client",
  "maintainers": ["admin"],
  "license": "Apache-2.0",
  "downloads": 150000,
  "stars": 1234,
  "score": {
    "quality": 0.85,
    "popularity": 0.95,
    "maintenance": 0.90,
    "overall": 0.92
  },
  "versions": [
    {
      "version": "2.0.0",
      "publishedAt": "2024-01-15T10:30:00Z"
    }
  ]
}
```

#### Download Package

```http
GET /api/packages/{name}/{version}/download

Response: 302 Redirect to tarball URL
```

### Service Marketplace API

#### List Services

```http
GET /api/services?category={category}&limit=20&offset=0

Response:
{
  "services": [
    {
      "id": "svc-postgres",
      "name": "PostgreSQL Managed",
      "slug": "postgres-managed",
      "category": "database",
      "description": "Fully managed PostgreSQL",
      "averageRating": 4.9,
      "activeDeployments": 1234
    }
  ],
  "total": 87
}
```

#### Get Service Details

```http
GET /api/services/{slug}

Response:
{
  "id": "svc-postgres",
  "name": "PostgreSQL Managed",
  "description": "Fully managed PostgreSQL",
  "pricing": {
    "model": "subscription",
    "tiers": [
      {
        "id": "starter",
        "name": "Starter",
        "price": 19,
        "period": "month",
        "features": ["10 GB storage", "50 connections"]
      }
    ]
  },
  "specifications": {
    "regions": ["us-east-1", "us-west-2"],
    "sla": {
      "uptime": 99.9,
      "responseTime": 50,
      "support": "24/7"
    }
  }
}
```

#### Deploy Service

```http
POST /api/deployments
Authorization: Bearer {token}
Content-Type: application/json

{
  "serviceId": "svc-postgres",
  "name": "my-database",
  "config": {
    "tier": "starter",
    "region": "us-east-1"
  }
}

Response:
{
  "deploymentId": "deploy-abc123",
  "status": "provisioning",
  "endpoint": "deploy-abc123.db.elide.services:5432",
  "credentials": {
    "connectionString": "postgresql://..."
  },
  "estimatedTime": "5-10 seconds"
}
```

#### Get Deployment Status

```http
GET /api/deployments/{id}
Authorization: Bearer {token}

Response:
{
  "id": "deploy-abc123",
  "name": "my-database",
  "status": "running",
  "endpoint": "deploy-abc123.db.elide.services:5432",
  "metrics": {
    "requests": 125432,
    "errors": 12,
    "avgResponseTime": 23,
    "uptime": 99.95
  },
  "billing": {
    "currentCost": 9.50,
    "projectedCost": 19.00,
    "currency": "USD"
  }
}
```

#### Stop Deployment

```http
POST /api/deployments/{id}/stop
Authorization: Bearer {token}

Response:
{
  "success": true,
  "status": "stopped"
}
```

### Analytics API

```http
GET /api/analytics?type=package&id=pkg-123&days=30
Authorization: Bearer {token}

Response:
{
  "period": "30 days",
  "analytics": [
    {
      "date": "2024-01-15",
      "event_type": "downloaded",
      "count": 1523
    }
  ]
}
```

### Webhook API

#### Create Webhook

```http
POST /api/webhooks
Authorization: Bearer {token}
Content-Type: application/json

{
  "url": "https://your-app.com/webhook",
  "events": ["package.published", "service.deployed"]
}

Response:
{
  "webhookId": "webhook-xyz789",
  "url": "https://your-app.com/webhook",
  "events": ["package.published", "service.deployed"],
  "secret": "whsec_abc123..."
}
```

#### List Webhooks

```http
GET /api/webhooks
Authorization: Bearer {token}

Response:
{
  "webhooks": [
    {
      "id": "webhook-xyz789",
      "url": "https://your-app.com/webhook",
      "events": ["package.published"],
      "active": true,
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ]
}
```

## Configuration

### Environment Variables

```bash
# API Configuration
PORT=3000                           # Main API server port
REGISTRY_PORT=4873                  # Package registry port
MARKETPLACE_PORT=3001               # Marketplace API port
DASHBOARD_PORT=8080                 # Web dashboard port
ORCHESTRATOR_PORT=3002              # Service orchestrator port

# URLs
ELIDE_REGISTRY_URL=http://localhost:4873
ELIDE_API_URL=http://localhost:3000
ELIDE_MARKETPLACE_URL=http://localhost:3001

# Database
DATABASE_PATH=./marketplace.db
REGISTRY_DATABASE_PATH=./registry.db

# Authentication
JWT_SECRET=your-secret-key
TOKEN_EXPIRY=7d

# External Services
CDN_URL=https://cdn.elide.dev
STORAGE_BUCKET=elide-marketplace-storage

# Email (for notifications)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=notifications@elide.dev
SMTP_PASS=password

# Billing
STRIPE_API_KEY=sk_test_...
BILLING_EMAIL=billing@elide.dev
```

## Development

### Running Tests

```bash
# Run all tests
elide test

# Run specific test suite
elide test registry/
elide test marketplace/
```

### Code Structure

```
├── server.ts                    # Main API server
│   └── Authentication, Package API, Analytics, Webhooks
├── registry/
│   ├── registry-server.ts       # npm-compatible registry
│   ├── package-scorer.ts        # Quality scoring algorithm
│   └── security-scanner.ts      # Vulnerability scanning
├── marketplace/
│   ├── marketplace-server.ts    # Service marketplace API
│   └── service-provisioner.ts   # Service provisioning engine
├── client/
│   ├── publish-cli.ts           # Package publishing CLI
│   └── service-cli.ts           # Service management CLI
├── dashboard/
│   └── dashboard-server.ts      # Web interface
├── services/
│   └── service-orchestrator.ts  # Service templates & monitoring
└── scripts/
    └── seed-data.ts             # Database seeding
```

### Adding New Services

To add a new service to the marketplace:

1. Define service template in `services/service-orchestrator.ts`:

```typescript
"my-service": {
  id: "svc-myservice",
  name: "My Service",
  slug: "my-service",
  category: "compute",
  description: "Description of my service",
  pricing: {
    model: "subscription",
    tiers: [...]
  },
  specifications: {
    runtime: "...",
    regions: [...],
    ...
  }
}
```

2. Add provisioning logic in `marketplace/service-provisioner.ts`:

```typescript
private async provisionMyService(
  request: ProvisioningRequest,
  service: any
): Promise<ProvisioningResult> {
  // Provisioning logic
  return {
    success: true,
    deploymentId: request.deploymentId,
    endpoint: "...",
    credentials: {...}
  };
}
```

3. Restart the services:

```bash
elide run services/service-orchestrator.ts
elide run marketplace/marketplace-server.ts
```

## Security Considerations

### Package Security

- **Malware Scanning**: All packages are scanned for malicious code patterns
- **Typosquatting Prevention**: Package names are checked against popular packages
- **Dependency Scanning**: Recursive dependency vulnerability checking
- **Code Signing**: Optional package signing for verification
- **Access Control**: Role-based permissions for package publishing

### Service Security

- **Isolated Deployments**: Each deployment runs in isolated environment
- **Encrypted Credentials**: All credentials encrypted at rest
- **Network Isolation**: Services deployed with network isolation
- **Audit Logging**: Comprehensive audit trail for all operations
- **Rate Limiting**: API rate limiting to prevent abuse

## Performance

### Benchmarks

**Package Registry**:
- Package search: <50ms p95
- Package metadata: <20ms p95
- Package download: CDN-backed

**Service Marketplace**:
- Service list: <100ms p95
- Service deployment: 5-30 seconds
- Status queries: <30ms p95

**Scalability**:
- Handles 10,000+ packages
- 1,000+ simultaneous deployments
- 100,000+ API requests/day

## License

MIT License - see LICENSE file for details

## Support

- Documentation: https://marketplace.elide.dev/docs
- GitHub Issues: https://github.com/elide-dev/elide-marketplace/issues
- Discord: https://discord.gg/elide
- Email: support@elide.dev

## Contributing

Contributions welcome! Please see CONTRIBUTING.md for guidelines.

## Credits

Built with Elide Runtime - https://elide.dev

Inspired by:
- npm registry
- npms.io (package scoring)
- Snyk (security scanning)
- Vercel Marketplace
- AWS Marketplace
