# Elide Marketplace - Quick Start Guide

Get the Elide Marketplace running in under 5 minutes!

## Prerequisites

- Elide Runtime v0.11.0-beta11-rc1 or later
- 5 terminal windows (or use `tmux`/`screen`)

## Step 1: Seed the Database

```bash
cd elide-marketplace
elide run scripts/seed-data.ts
```

This creates sample data including:
- 3 demo users (admin, publisher, demo)
- 5 sample packages
- 2 active deployments
- 30 days of analytics data

## Step 2: Start All Services

Open 5 terminal windows and run:

**Terminal 1 - Main API Server (port 3000)**
```bash
elide run server.ts
```

**Terminal 2 - Package Registry (port 4873)**
```bash
elide run registry/registry-server.ts
```

**Terminal 3 - Service Marketplace (port 3001)**
```bash
elide run marketplace/marketplace-server.ts
```

**Terminal 4 - Web Dashboard (port 8080)**
```bash
elide run dashboard/dashboard-server.ts
```

**Terminal 5 - Service Orchestrator (port 3002)**
```bash
elide run services/service-orchestrator.ts
```

**Bonus - Health Monitoring Dashboard (port 9090)**
```bash
elide run monitoring/health-dashboard.ts
```

## Step 3: Explore the Platform

### Web Interface

Open in your browser:
- **Main Dashboard**: http://localhost:8080
- **Health Monitor**: http://localhost:9090

### Command Line Tools

```bash
# Make CLI tools executable
chmod +x client/*.ts

# Login
./client/publish-cli.ts login
# Username: demo
# Password: demo123

# Search packages
./client/publish-cli.ts search elide

# View package info
./client/publish-cli.ts info @elide/http

# List available services
./client/service-cli.ts list

# Deploy a database
./client/service-cli.ts deploy postgres-managed

# Check deployment status
./client/service-cli.ts deployments
```

### API Examples

```bash
# Health check
curl http://localhost:3000/health

# Search packages
curl http://localhost:3000/api/packages/search?q=elide

# Get package details
curl http://localhost:3000/api/packages/@elide/http

# List services
curl http://localhost:3001/api/services

# List service categories
curl http://localhost:3001/api/categories
```

## Step 4: Test Key Features

### 1. Browse Packages

```bash
# Search for packages
./client/publish-cli.ts search http

# Get detailed package info
./client/publish-cli.ts info @elide/http
```

### 2. Deploy a Service

```bash
# List available services
./client/service-cli.ts list

# View service details
./client/service-cli.ts info postgres-managed

# Deploy PostgreSQL
./client/service-cli.ts deploy postgres-managed
# Select tier: 1 (Free)
# Select region: 1 (us-east-1)

# Check status
./client/service-cli.ts deployments
```

### 3. View Analytics

```bash
# Generate analytics report
elide run scripts/analytics-report.ts

# Save to file
elide run scripts/analytics-report.ts text analytics-report.txt

# JSON format
elide run scripts/analytics-report.ts json > analytics.json
```

## Using Docker Compose

Alternatively, use Docker Compose to run everything:

```bash
docker-compose up
```

This starts all services in containers with automatic restart.

## Test Credentials

The seeded database includes these test accounts:

| Username  | Password     | Role      | Use Case                    |
|-----------|--------------|-----------|----------------------------|
| admin     | admin123     | admin     | Full platform access       |
| publisher | publisher123 | publisher | Publishing packages        |
| demo      | demo123      | user      | General marketplace usage  |

## Common Tasks

### Publish a Package

```bash
# Create a simple package
mkdir my-package
cd my-package

cat > package.json << EOF
{
  "name": "@myorg/my-package",
  "version": "1.0.0",
  "description": "My awesome package",
  "main": "index.ts",
  "license": "MIT"
}
EOF

cat > index.ts << EOF
export function hello(name: string): string {
  return \`Hello, \${name}!\`;
}
EOF

# Publish
../client/publish-cli.ts publish
```

### Deploy and Monitor a Service

```bash
# Deploy Redis cache
./client/service-cli.ts deploy redis-cache

# Get deployment ID from output, then:
./client/service-cli.ts status <deployment-id>

# View metrics
curl http://localhost:3001/api/deployments/<deployment-id> | jq '.metrics'

# Stop when done
./client/service-cli.ts stop <deployment-id>
```

### Run Security Scan

```bash
# Scan a package version
elide run registry/security-scanner.ts @elide/http 2.0.0
```

### Update Package Scores

```bash
# Recalculate quality scores for all packages
elide run registry/package-scorer.ts
```

### View Health Dashboard

Open http://localhost:9090 to see:
- Real-time service health
- System metrics (CPU, memory, disk)
- Database statistics
- Active alerts

## Troubleshooting

### Services Won't Start

Check if ports are already in use:
```bash
lsof -i :3000  # Main API
lsof -i :4873  # Registry
lsof -i :3001  # Marketplace
lsof -i :8080  # Dashboard
```

Kill any conflicting processes or change ports via environment variables.

### Database Errors

Reset the database:
```bash
rm -f marketplace.db registry.db
elide run scripts/seed-data.ts
```

### CLI Authentication Failed

Generate a new token:
```bash
rm ~/.elide-marketplace
./client/publish-cli.ts login
```

## Next Steps

1. **Read the full README.md** for detailed API documentation
2. **Explore the codebase** to understand the architecture
3. **Customize services** in `services/service-orchestrator.ts`
4. **Add new packages** to the registry
5. **Deploy your own services** using the marketplace

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    Web Dashboard (8080)                  │
│                   Health Monitor (9090)                  │
└──────────────────┬──────────────────────────────────────┘
                   │
┌──────────────────┴──────────────────────────────────────┐
│              Main API Server (3000)                      │
│   Authentication │ Analytics │ Webhooks │ Packages      │
└──────┬───────────┴──────────┬───────────────────────────┘
       │                      │
┌──────┴────────┐    ┌────────┴──────────┐
│   Registry    │    │   Marketplace     │
│    (4873)     │    │     (3001)        │
│               │    │                   │
│ • npm API     │    │ • Services        │
│ • Security    │    │ • Deployments     │
│ • Scoring     │    │ • Billing         │
└───────────────┘    └─────────┬─────────┘
                               │
                     ┌─────────┴─────────┐
                     │   Orchestrator    │
                     │     (3002)        │
                     │                   │
                     │ • Provisioning    │
                     │ • Health Checks   │
                     │ • Monitoring      │
                     └───────────────────┘
```

## File Structure

```
elide-marketplace/
├── server.ts                    # Main API (1,130 lines)
├── registry/
│   ├── registry-server.ts       # Package registry (740 lines)
│   ├── package-scorer.ts        # Quality scoring (412 lines)
│   └── security-scanner.ts      # Security scanning (488 lines)
├── marketplace/
│   ├── marketplace-server.ts    # Service marketplace (695 lines)
│   └── service-provisioner.ts   # Service provisioning (402 lines)
├── client/
│   ├── publish-cli.ts           # Publishing CLI (449 lines)
│   ├── service-cli.ts           # Service CLI (435 lines)
│   └── marketplace-sdk.ts       # TypeScript SDK (344 lines)
├── dashboard/
│   └── dashboard-server.ts      # Web UI (522 lines)
├── services/
│   └── service-orchestrator.ts  # Service templates (503 lines)
├── monitoring/
│   └── health-dashboard.ts      # Health monitoring (504 lines)
├── scripts/
│   ├── seed-data.ts             # Database seeding (268 lines)
│   ├── migrate-db.ts            # Migrations (252 lines)
│   └── analytics-report.ts      # Analytics (277 lines)
├── package.json                 # Dependencies
├── docker-compose.yml           # Docker setup
├── .env.example                 # Configuration template
├── README.md                    # Full documentation (965 lines)
└── QUICKSTART.md                # This file

Total: 8,520+ lines of marketplace platform code
```

## Resources

- **Documentation**: Full API docs in README.md
- **Examples**: See `scripts/` for usage examples
- **Source Code**: https://github.com/elide-dev/elide-marketplace
- **Elide Runtime**: https://elide.dev

## Support

- **Issues**: https://github.com/elide-dev/elide-marketplace/issues
- **Discord**: https://discord.gg/elide
- **Email**: support@elide.dev

Happy building! 🚀
