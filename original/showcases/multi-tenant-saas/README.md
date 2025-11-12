# Multi-Tenant SaaS Backend - Enterprise Edition

A production-ready, enterprise-grade multi-tenant SaaS platform backend with complete tenant isolation, advanced billing, compliance features, and white-labeling capabilities.

## Table of Contents

- [Features](#features)
- [Architecture](#architecture)
- [Enterprise Modules](#enterprise-modules)
- [Getting Started](#getting-started)
- [API Documentation](#api-documentation)
- [Compliance & Security](#compliance--security)
- [Deployment](#deployment)
- [Best Practices](#best-practices)

## Features

### Core Features
- **Multi-Tenancy**: Complete data, configuration, and resource isolation
- **Subscription Management**: Multiple plans with different limits and billing cycles
- **Usage Tracking**: Real-time metering of API calls, storage, bandwidth, and more
- **Billing Integration**: Automated invoicing with Stripe payment processing
- **Admin Panel API**: Comprehensive tenant management and analytics

### Enterprise Features
- **Automated Provisioning**: Zero-touch tenant onboarding with database and resource setup
- **White-Labeling**: Custom branding, domains, email templates, and UI customization
- **Database-per-Tenant**: Support for shared, schema-per-tenant, or database-per-tenant isolation
- **Audit Logging**: Comprehensive audit trail for all actions with retention policies
- **GDPR Compliance**: Right to access, erasure, portability, and data processing agreements
- **SOC2 Controls**: Implemented security controls with compliance reporting
- **Advanced Metering**: Multi-dimensional usage tracking with quotas and alerts
- **Tenant Analytics**: Usage trends, cost estimation, and performance metrics
- **Custom Domains**: SSL-secured custom domains with automatic DNS verification
- **RBAC**: Role-based access control with granular permissions
- **SSO Ready**: Authentication hooks for SAML, OAuth, and OIDC integration
- **Backup & Restore**: Per-tenant backup capabilities with point-in-time recovery

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                       Admin Panel API                            │
│  Dashboard, Analytics, Provisioning, Compliance, White-Label    │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Tenant Manager                                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ Provisioner  │  │ White-Label  │  │ Compliance   │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└───────────────────────────┬─────────────────────────────────────┘
                            │
         ┌──────────────────┼──────────────────┐
         ▼                  ▼                  ▼
┌────────────────┐  ┌────────────────┐  ┌────────────────┐
│   Database     │  │ Usage Tracker  │  │ Billing Engine │
│   (Isolated)   │  │ & Analytics    │  │ (Stripe)       │
└────────────────┘  └────────────────┘  └────────────────┘
         │                  │                  │
         └──────────────────┼──────────────────┘
                            ▼
                   ┌────────────────┐
                   │ Audit Logger   │
                   └────────────────┘
```

## Enterprise Modules

### 1. Tenant Provisioner (`tenant-provisioner.ts`)

Automated tenant provisioning with support for multiple isolation strategies.

**Features:**
- Automated database provisioning (shared, schema-per-tenant, database-per-tenant)
- Storage bucket creation with encryption
- CDN setup and configuration
- Custom domain configuration
- Owner account creation
- Initial data seeding
- Welcome email automation
- Rollback on failure

**Example:**
```typescript
const provisioner = new TenantProvisioner();

const result = await provisioner.provision({
  tenantId: 'tenant_123',
  name: 'Acme Corp',
  slug: 'acme',
  plan: 'enterprise',
  isolationStrategy: IsolationStrategy.DATABASE_PER_TENANT,
  owner: {
    email: 'admin@acme.com',
    name: 'John Doe'
  },
  config: {
    customDomain: 'acme.com',
    features: { advancedAnalytics: true }
  }
});
```

### 2. Billing Engine (`billing-engine.ts`)

Comprehensive Stripe integration for subscription management and payments.

**Features:**
- Stripe customer and subscription management
- Proration calculations for plan changes
- Invoice generation and payment processing
- Dunning management for failed payments
- Usage-based billing support
- Tax calculations by location
- Refund processing
- Webhook handling

**Example:**
```typescript
const billingEngine = new BillingEngine(stripeConfig);

// Create customer and subscription
const customer = await billingEngine.createCustomer({
  tenantId: 'tenant_123',
  email: 'billing@acme.com',
  name: 'Acme Corp'
});

const subscription = await billingEngine.createSubscription({
  tenantId: 'tenant_123',
  customerId: customer.id,
  plan: 'pro',
  billingCycle: 'monthly',
  trialDays: 14
});
```

### 3. Advanced Usage Tracker (`usage-tracker.ts`)

Multi-dimensional usage tracking with quotas and alerting.

**Metric Types:**
- API Calls
- Storage (bytes)
- Bandwidth (bytes)
- Compute Time
- Database Queries
- Active Users
- Projects
- Transactions

**Features:**
- Real-time usage tracking
- Quota enforcement with soft/hard limits
- Usage alerts and notifications
- Historical analytics and trends
- Cost estimation
- Rate limiting
- Usage export

**Example:**
```typescript
const tracker = new AdvancedUsageTracker();

// Track usage
tracker.increment('tenant_123', MetricType.API_CALLS);
tracker.track('tenant_123', MetricType.STORAGE, 1024 * 1024); // 1MB

// Set quotas
tracker.setQuota('tenant_123', {
  metricType: MetricType.API_CALLS,
  limit: 100000,
  period: 'monthly',
  softLimit: 80000
});

// Check if action is allowed
const check = tracker.canPerformAction('tenant_123', MetricType.API_CALLS);
if (!check.allowed) {
  throw new Error(check.reason);
}
```

### 4. Admin Panel (`admin-panel.ts`)

Comprehensive tenant administration with bulk operations.

**Features:**
- Dashboard with key metrics
- Tenant CRUD operations
- User management
- Subscription management
- Usage analytics
- Billing operations
- Bulk operations
- Data export (CSV/JSON)
- User impersonation for support
- System health monitoring

**Example:**
```typescript
const adminPanel = new AdminPanel({
  tenantManager,
  userManager,
  billingEngine,
  usageTracker,
  auditLogger
});

const context: AdminContext = {
  adminId: 'admin_123',
  permissions: ['*']
};

// Get dashboard stats
const stats = await adminPanel.getDashboardStats(context);

// Create tenant
const tenant = await adminPanel.createTenant(context, {
  name: 'New Company',
  slug: 'newco',
  plan: 'pro',
  billingCycle: 'monthly',
  owner: {
    email: 'owner@newco.com',
    name: 'Jane Smith'
  }
});
```

### 5. White-Label Manager (`white-label.ts`)

Complete tenant customization and branding.

**Features:**
- Custom color schemes and branding
- Logo and favicon management
- Custom fonts and typography
- Email template customization
- UI/UX customization
- Localization and translations
- Custom domains with SSL
- Asset management (CDN)
- Generated CSS per tenant

**Example:**
```typescript
const whiteLabelManager = new WhiteLabelManager();

// Set branding
whiteLabelManager.setBranding('tenant_123', {
  colors: {
    primary: '#FF6B35',
    secondary: '#004E89'
  },
  logo: {
    light: 'https://cdn.acme.com/logo-light.svg',
    dark: 'https://cdn.acme.com/logo-dark.svg'
  },
  fonts: {
    heading: 'Montserrat',
    body: 'Open Sans'
  }
});

// Add custom domain
const domain = await whiteLabelManager.addCustomDomain('tenant_123', 'app.acme.com');

// Generate CSS
const css = whiteLabelManager.generateCSS('tenant_123');
```

### 6. Audit Logger (`audit-logger.ts`)

Comprehensive audit trail for compliance and security.

**Features:**
- Authentication events
- User management events
- Data change tracking
- Security events
- Billing events
- Configuration changes
- GDPR/compliance events
- Search and filtering
- Retention policies
- Export capabilities

**Example:**
```typescript
const auditLogger = new AuditLogger();

// Log authentication
auditLogger.logAuth({
  tenantId: 'tenant_123',
  userId: 'user_456',
  eventType: AuditEventType.LOGIN,
  success: true,
  ipAddress: '192.168.1.1',
  location: { country: 'US', city: 'San Francisco' }
});

// Log data change
auditLogger.logDataChange({
  tenantId: 'tenant_123',
  userId: 'user_456',
  eventType: AuditEventType.DATA_UPDATED,
  resource: { type: 'project', id: 'proj_789', name: 'Website Redesign' },
  changes: [
    { field: 'status', oldValue: 'active', newValue: 'completed' }
  ]
});

// Query logs
const result = auditLogger.query({
  tenantId: 'tenant_123',
  startDate: Date.now() - 30 * 24 * 60 * 60 * 1000 // Last 30 days
}, { limit: 100 });
```

### 7. Compliance Manager (`compliance-manager.ts`)

GDPR, SOC2, and compliance management.

**Features:**
- GDPR request handling (access, erasure, portability, etc.)
- Consent management
- Data retention policies
- Data Processing Agreements (DPA)
- Data breach reporting
- SOC2 control tracking
- Compliance reporting
- Automated notifications

**Example:**
```typescript
const complianceManager = new ComplianceManager(auditLogger);

// Submit GDPR request
const request = await complianceManager.submitGDPRRequest({
  tenantId: 'tenant_123',
  userId: 'user_456',
  type: GDPRRequestType.ERASURE,
  reason: 'User requested account deletion'
});

// Process GDPR request
await complianceManager.processGDPRRequest(request.id, 'admin_123');

// Record consent
complianceManager.recordConsent({
  tenantId: 'tenant_123',
  userId: 'user_456',
  type: ConsentType.MARKETING,
  granted: true,
  version: '2.0',
  source: 'settings_page'
});

// Generate compliance report
const report = complianceManager.generateComplianceReport(
  'tenant_123',
  ComplianceStandard.GDPR,
  startDate,
  endDate
);
```

## Getting Started

### Prerequisites

- Elide runtime (beta11-rc1 or later)
- Stripe account (for billing features)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd multi-tenant-saas
```

2. Set environment variables:
```bash
export STRIPE_SECRET_KEY=sk_test_...
export STRIPE_WEBHOOK_SECRET=whsec_...
export STRIPE_PUBLISHABLE_KEY=pk_test_...
```

3. Run the server:
```bash
elide serve server.ts
```

The server will start on `http://localhost:3000`.

## API Documentation

### Admin API Endpoints

#### Tenant Management

```bash
# List all tenants
GET /admin/tenants

# Create tenant
POST /admin/tenants
{
  "name": "Acme Corp",
  "slug": "acme",
  "plan": "pro",
  "billingCycle": "monthly",
  "customDomain": "acme.com"
}

# Get tenant details
GET /admin/tenants/:id

# Update subscription
PUT /admin/tenants/:id/subscription
{
  "plan": "enterprise",
  "billingCycle": "yearly"
}

# Get usage stats
GET /admin/tenants/:id/usage

# Get invoices
GET /admin/tenants/:id/invoices

# Get analytics
GET /admin/tenants/:id/analytics

# Dashboard statistics
GET /admin/dashboard
```

#### Provisioning

```bash
# Provision new tenant (automated)
POST /admin/provision
{
  "name": "New Company",
  "slug": "newco",
  "plan": "enterprise",
  "isolationStrategy": "database_per_tenant",
  "owner": {
    "email": "admin@newco.com",
    "name": "John Doe"
  },
  "config": {
    "customDomain": "newco.com",
    "features": {
      "advancedAnalytics": true,
      "sso": true
    }
  }
}

# Get provisioning status
GET /admin/provision/:tenantId
```

#### White-Label

```bash
# Set tenant branding
PUT /admin/tenants/:id/branding
{
  "colors": {
    "primary": "#FF6B35",
    "secondary": "#004E89"
  },
  "logo": {
    "light": "https://cdn.example.com/logo-light.svg"
  }
}

# Add custom domain
POST /admin/tenants/:id/domains
{
  "domain": "app.acme.com"
}
```

#### Compliance

```bash
# Get GDPR requests
GET /admin/tenants/:id/gdpr

# Process GDPR request
POST /admin/gdpr/:requestId/process
{
  "processedBy": "admin_123"
}

# Generate compliance report
GET /admin/tenants/:id/compliance?standard=gdpr&start=1234567890&end=1234567890
```

#### Audit & Security

```bash
# Query audit logs
GET /admin/audit?tenantId=tenant_123&limit=100
```

### Tenant API Endpoints

All tenant endpoints require the `X-Tenant-Id` header.

#### Tenant Info

```bash
# Get tenant info
GET /api/tenant
Headers: X-Tenant-Id: tenant_123

# Get tenant branding
GET /api/branding
Headers: X-Tenant-Id: tenant_123

# Health check
GET /health
Headers: X-Tenant-Id: tenant_123
```

#### Usage & Billing

```bash
# Get usage stats
GET /api/usage
Headers: X-Tenant-Id: tenant_123

# Get detailed metrics
GET /api/usage/metrics
Headers: X-Tenant-Id: tenant_123

# Get usage history
GET /api/usage/history/api_calls?days=30
Headers: X-Tenant-Id: tenant_123
```

#### GDPR & Privacy

```bash
# Submit GDPR request
POST /api/gdpr/request
Headers: X-Tenant-Id: tenant_123, X-User-Id: user_456
{
  "type": "access",
  "reason": "I want to see my data"
}

# Get my GDPR requests
GET /api/gdpr/requests
Headers: X-Tenant-Id: tenant_123, X-User-Id: user_456

# Record consent
POST /api/consent
Headers: X-Tenant-Id: tenant_123, X-User-Id: user_456
{
  "type": "marketing",
  "granted": true,
  "source": "settings"
}

# Get consent history
GET /api/consent/history
Headers: X-Tenant-Id: tenant_123, X-User-Id: user_456
```

#### Audit

```bash
# Get my audit logs
GET /api/audit?limit=50
Headers: X-Tenant-Id: tenant_123, X-User-Id: user_456
```

## Subscription Plans

### Free Plan
- **Price**: $0/month
- **Users**: 3
- **Projects**: 5
- **Storage**: 1 GB
- **API Calls**: 1,000/day
- **Bandwidth**: 10 GB/month
- **Features**: Basic features

### Starter Plan
- **Price**: $29/month or $290/year
- **Users**: 10
- **Projects**: 25
- **Storage**: 10 GB
- **API Calls**: 10,000/day
- **Bandwidth**: 100 GB/month
- **Features**: Priority support, Advanced analytics

### Pro Plan
- **Price**: $99/month or $990/year
- **Users**: 50
- **Projects**: 100
- **Storage**: 100 GB
- **API Calls**: 100,000/day
- **Bandwidth**: 1 TB/month
- **Features**: White-labeling, Custom domains, API access

### Enterprise Plan
- **Price**: $499/month or $4,990/year
- **Users**: Unlimited
- **Projects**: Unlimited
- **Storage**: Unlimited
- **API Calls**: Unlimited
- **Bandwidth**: Unlimited
- **Features**: SSO, SLA, Dedicated support, Custom integrations, Database-per-tenant

## Compliance & Security

### GDPR Compliance

The platform fully supports GDPR requirements:

- **Right to Access**: Users can request all their data
- **Right to Erasure**: Complete data deletion with verification
- **Right to Portability**: Export data in machine-readable format
- **Right to Rectification**: Update incorrect data
- **Right to Restrict**: Limit data processing
- **Right to Object**: Object to data processing
- **Consent Management**: Granular consent tracking with withdrawal
- **Data Breach Notification**: Automated notifications within 72 hours
- **Data Processing Agreements**: Track and manage DPAs

### SOC2 Compliance

Implemented controls include:

- **Common Criteria (CC)**:
  - CC1: Control Environment
  - CC2: Communication and Information
  - CC3: Risk Assessment
  - CC4: Monitoring Activities
  - CC5: Control Activities
  - CC6: Logical and Physical Access Controls
  - CC7: System Operations
  - CC8: Change Management
  - CC9: Risk Mitigation

- **Availability (A)**: High availability architecture
- **Confidentiality (C)**: Encryption at rest and in transit
- **Processing Integrity (PI)**: Data validation and error handling
- **Privacy (P)**: Privacy controls and consent management

### Security Features

- **Encryption**: Data encrypted at rest and in transit
- **Audit Logging**: Comprehensive audit trail for all actions
- **Access Control**: RBAC with granular permissions
- **Rate Limiting**: Per-tenant rate limiting
- **Input Validation**: All inputs validated and sanitized
- **SQL Injection Prevention**: Parameterized queries
- **XSS Prevention**: Output escaping
- **CSRF Protection**: Token-based protection
- **Password Security**: Bcrypt hashing with salts
- **MFA Support**: Two-factor authentication ready
- **Session Management**: Secure session handling
- **IP Whitelisting**: Optional IP restrictions
- **Vulnerability Scanning**: Regular security audits

## Deployment

### Environment Variables

```bash
# Required
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PUBLISHABLE_KEY=pk_live_...

# Optional
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_S3_BUCKET=...
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=...
SMTP_PASSWORD=...
```

### Docker

```dockerfile
FROM elide/elide:beta11-rc1

WORKDIR /app

COPY . .

EXPOSE 3000

CMD ["elide", "serve", "server.ts"]
```

Build and run:
```bash
docker build -t multi-tenant-saas .
docker run -p 3000:3000 \
  -e STRIPE_SECRET_KEY=... \
  -e STRIPE_WEBHOOK_SECRET=... \
  multi-tenant-saas
```

### Kubernetes

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: saas-backend
spec:
  replicas: 3
  selector:
    matchLabels:
      app: saas-backend
  template:
    metadata:
      labels:
        app: saas-backend
    spec:
      containers:
      - name: saas-backend
        image: multi-tenant-saas:latest
        ports:
        - containerPort: 3000
        env:
        - name: STRIPE_SECRET_KEY
          valueFrom:
            secretKeyRef:
              name: stripe-secret
              key: secret-key
        resources:
          requests:
            memory: "512Mi"
            cpu: "500m"
          limits:
            memory: "1Gi"
            cpu: "1000m"
```

## Best Practices

### Tenant Isolation

1. **Always validate tenant context** on every request
2. **Never trust client-provided tenant IDs** - always derive from authentication
3. **Use row-level security** in shared databases
4. **Implement tenant-scoped queries** for all data access
5. **Consider database-per-tenant** for enterprise customers

### Usage Tracking

1. **Track usage asynchronously** to avoid request latency
2. **Implement soft limits** before hard limits
3. **Alert users** when approaching quotas
4. **Provide usage dashboards** for transparency
5. **Archive historical data** for analytics

### Billing

1. **Handle failed payments gracefully** with retry logic
2. **Implement dunning** for overdue accounts
3. **Provide invoice history** for transparency
4. **Calculate proration accurately** for plan changes
5. **Support multiple payment methods**

### Compliance

1. **Log all data access** for audit trails
2. **Implement data retention policies** for all data types
3. **Respond to GDPR requests** within 30 days
4. **Encrypt sensitive data** at rest and in transit
5. **Regular compliance audits** and reviews

### Performance

1. **Cache tenant configurations** to reduce database queries
2. **Use CDN** for static assets and white-label resources
3. **Implement connection pooling** for databases
4. **Monitor slow queries** and optimize
5. **Scale horizontally** for increased load

### Security

1. **Never log sensitive data** (passwords, tokens, etc.)
2. **Rotate credentials regularly**
3. **Implement rate limiting** per tenant
4. **Use secure session management**
5. **Regular security audits** and penetration testing

## Testing

### Example Test Scenarios

#### Create and Provision Tenant
```bash
curl -X POST http://localhost:3000/admin/provision \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Company",
    "slug": "testco",
    "plan": "pro",
    "isolationStrategy": "shared_database",
    "owner": {
      "email": "admin@testco.com",
      "name": "Test Admin"
    }
  }'
```

#### Set Branding
```bash
curl -X PUT http://localhost:3000/admin/tenants/tenant_123/branding \
  -H "Content-Type: application/json" \
  -d '{
    "colors": {
      "primary": "#FF6B35"
    }
  }'
```

#### Submit GDPR Request
```bash
curl -X POST http://localhost:3000/api/gdpr/request \
  -H "Content-Type: application/json" \
  -H "X-Tenant-Id: tenant_123" \
  -H "X-User-Id: user_456" \
  -d '{
    "type": "access",
    "reason": "I want to see my data"
  }'
```

## License

MIT License - See LICENSE file for details

## Support

For enterprise support, contact: enterprise@example.com

## Contributing

Contributions are welcome! Please read CONTRIBUTING.md for guidelines.
