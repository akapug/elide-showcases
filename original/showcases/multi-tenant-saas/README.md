# Multi-Tenant SaaS Backend

A production-ready multi-tenant SaaS platform backend with complete tenant isolation, subscription management, usage tracking, and billing integration.

## Features

- **Tenant Isolation**: Complete data, configuration, and resource isolation
- **Subscription Management**: Multiple plans with different limits
- **Usage Tracking**: Real-time metering of API calls, storage, and bandwidth
- **Billing Integration**: Automated invoicing and payment processing
- **Admin Panel API**: Comprehensive tenant management
- **Tenant Provisioning**: Automated tenant onboarding
- **Custom Domains**: Support for tenant-specific domains
- **Feature Flags**: Per-tenant feature toggles
- **Rate Limiting**: Per-tenant usage quotas

## Architecture

```
┌──────────────────────┐
│   Admin Panel API    │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│  Tenant Manager      │
│  ┌────────────────┐  │
│  │ Provisioning   │  │
│  └────────────────┘  │
│  ┌────────────────┐  │
│  │ Configuration  │  │
│  └────────────────┘  │
└──────────┬───────────┘
           │
     ┌─────┴─────┬──────────────┐
     ▼           ▼              ▼
┌─────────┐ ┌──────────┐ ┌────────────┐
│ Tenant  │ │  Usage   │ │  Billing   │
│   DB    │ │ Tracker  │ │  Manager   │
└─────────┘ └──────────┘ └────────────┘
```

## Subscription Plans

### Free Plan
- **Price**: $0/month
- **Users**: 3
- **Projects**: 5
- **Storage**: 1 GB
- **API Calls**: 1,000/day
- **Bandwidth**: 10 GB/month

### Starter Plan
- **Price**: $29/month or $290/year
- **Users**: 10
- **Projects**: 25
- **Storage**: 10 GB
- **API Calls**: 10,000/day
- **Bandwidth**: 100 GB/month

### Pro Plan
- **Price**: $99/month or $990/year
- **Users**: 50
- **Projects**: 100
- **Storage**: 100 GB
- **API Calls**: 100,000/day
- **Bandwidth**: 1 TB/month

### Enterprise Plan
- **Price**: $499/month or $4,990/year
- **Users**: Unlimited
- **Projects**: Unlimited
- **Storage**: Unlimited
- **API Calls**: Unlimited
- **Bandwidth**: Unlimited

## Tenant Identification

### Subdomain-based

```
https://acme.example.com/api/...
```

The tenant is identified by the subdomain (`acme`).

### Custom Domain

```
https://acme.com/api/...
```

The tenant is identified by the custom domain.

### Header-based

```bash
curl https://api.example.com/api/tenant \
  -H "X-Tenant-Id: tenant_123"
```

## Admin API

### Create Tenant

```bash
curl -X POST http://localhost:3000/admin/tenants \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Acme Corp",
    "slug": "acme",
    "plan": "pro",
    "billingCycle": "monthly",
    "customDomain": "acme.com"
  }'
```

Response:
```json
{
  "id": "tenant_1234567890_abc123",
  "name": "Acme Corp",
  "slug": "acme",
  "status": "trial",
  "plan": "pro",
  "billingCycle": "monthly",
  "customDomain": "acme.com",
  "config": {
    "branding": {
      "primaryColor": "#3B82F6"
    },
    "features": {},
    "settings": {}
  },
  "limits": {
    "maxUsers": 50,
    "maxProjects": 100,
    "maxStorage": 107374182400,
    "maxApiCalls": 100000,
    "maxBandwidth": 1099511627776
  },
  "createdAt": 1234567890000,
  "trialEndsAt": 1235777890000
}
```

### List Tenants

```bash
curl http://localhost:3000/admin/tenants
```

### Get Tenant

```bash
curl http://localhost:3000/admin/tenants/tenant_123
```

### Update Subscription

```bash
curl -X PUT http://localhost:3000/admin/tenants/tenant_123/subscription \
  -H "Content-Type: application/json" \
  -d '{
    "plan": "enterprise",
    "billingCycle": "yearly"
  }'
```

### Get Usage

```bash
curl http://localhost:3000/admin/tenants/tenant_123/usage
```

Response:
```json
{
  "tenantId": "tenant_123",
  "period": "2025-01",
  "apiCalls": 45678,
  "storage": 5368709120,
  "bandwidth": 53687091200,
  "activeUsers": 23,
  "timestamp": 1234567890000
}
```

### Get Invoices

```bash
curl http://localhost:3000/admin/tenants/tenant_123/invoices
```

Response:
```json
[
  {
    "id": "inv_123",
    "tenantId": "tenant_123",
    "amount": 99,
    "currency": "USD",
    "status": "paid",
    "dueDate": 1234567890000,
    "paidAt": 1234560000000,
    "items": [
      {
        "description": "Pro Plan - monthly",
        "quantity": 1,
        "unitPrice": 99,
        "amount": 99
      }
    ],
    "createdAt": 1234000000000
  }
]
```

## Tenant API

### Get Tenant Info

```bash
curl http://localhost:3000/api/tenant \
  -H "X-Tenant-Id: tenant_123"
```

Response:
```json
{
  "id": "tenant_123",
  "name": "Acme Corp",
  "plan": "pro",
  "config": {
    "branding": {
      "primaryColor": "#3B82F6"
    },
    "features": {},
    "settings": {}
  }
}
```

### Get Usage Stats

```bash
curl http://localhost:3000/api/usage \
  -H "X-Tenant-Id: tenant_123"
```

Response:
```json
{
  "usage": {
    "apiCalls": 45678,
    "storage": 5368709120,
    "bandwidth": 53687091200,
    "activeUsers": 23
  },
  "limits": {
    "maxUsers": 50,
    "maxProjects": 100,
    "maxStorage": 107374182400,
    "maxApiCalls": 100000,
    "maxBandwidth": 1099511627776
  }
}
```

## Tenant Isolation

### Data Isolation

```typescript
// All queries include tenant filter
const projects = await db.projects.findMany({
  where: {
    tenantId: tenant.id
  }
});

// Prevent cross-tenant access
if (resource.tenantId !== currentTenant.id) {
  throw new Error('Unauthorized');
}
```

### Schema-per-Tenant

For maximum isolation, use separate database schemas:

```typescript
const schema = `tenant_${tenant.id}`;
await db.raw(`SET search_path TO ${schema}`);
```

### Database-per-Tenant

For enterprise customers, use dedicated databases:

```typescript
const connection = getConnectionForTenant(tenant.id);
```

## Usage Tracking

### Track API Calls

```typescript
// Automatic tracking on each request
usageTracker.trackApiCall(tenant.id);

// Check limits
const limitCheck = usageTracker.checkLimits(tenant.id, tenant.limits);
if (limitCheck.exceeded) {
  return Response.json({
    error: 'Usage limits exceeded',
    violations: limitCheck.violations
  }, { status: 429 });
}
```

### Track Storage

```typescript
// Track file upload
usageTracker.trackStorage(tenant.id, fileSize);

// Track storage deletion (negative value)
usageTracker.trackStorage(tenant.id, -fileSize);
```

### Track Bandwidth

```typescript
// Track response size
const responseSize = new Blob([responseBody]).size;
usageTracker.trackBandwidth(tenant.id, responseSize);
```

## Billing

### Subscription Lifecycle

```
┌──────────┐
│  Trial   │ (14 days)
└────┬─────┘
     │
     ▼
┌──────────┐
│  Active  │ ◄──┐
└────┬─────┘    │
     │          │
     ├─────────┐│
     │ Renew   ││
     │         ││
     ▼         ││
┌──────────┐   ││
│ Payment  │───┘│
└────┬─────┘    │
     │          │
     ├─────────┐│
     │ Failed  ││
     │         ││
     ▼         ││
┌──────────┐   ││
│Suspended │   ││
└────┬─────┘   ││
     │         ││
     ├────────┐││
     │ Paid   │││
     │        │││
     └────────┘││
                │
     ▼          │
┌──────────┐   │
│Canceled  │   │
└──────────┘   │
                │
     ▼          │
┌──────────┐   │
│ Deleted  │   │
└──────────┘   │
```

### Invoice Generation

```typescript
// Generate invoice
const invoice = billingManager.generateInvoice(tenant);

// Invoice includes:
// - Line items (subscription, add-ons, usage overages)
// - Due date
// - Amount
// - Tax calculations
```

### Payment Processing

```typescript
// Process payment
const success = billingManager.processPayment(tenant.id, amount);

if (success) {
  // Activate subscription
  tenantManager.activate(tenant.id);
} else {
  // Suspend tenant
  tenantManager.suspend(tenant.id, 'Payment failed');
}
```

### Proration

When changing plans mid-cycle:

```typescript
// Calculate prorated amount
const daysRemaining = calculateDaysRemaining(tenant.subscriptionEndsAt);
const daysInCycle = tenant.billingCycle === 'monthly' ? 30 : 365;

const unusedAmount = (oldPlanPrice / daysInCycle) * daysRemaining;
const newAmount = (newPlanPrice / daysInCycle) * daysRemaining;

const prorationAmount = newAmount - unusedAmount;
```

## Tenant Configuration

### Branding

```typescript
tenant.config.branding = {
  primaryColor: '#FF5733',
  logo: 'https://cdn.example.com/logos/acme.png',
  favicon: 'https://cdn.example.com/favicons/acme.ico'
};
```

### Feature Flags

```typescript
tenant.config.features = {
  advancedAnalytics: true,
  apiAccess: true,
  sso: false,
  customIntegrations: true
};

// Check if feature is enabled
if (tenant.config.features.advancedAnalytics) {
  // Enable analytics
}
```

### Custom Settings

```typescript
tenant.config.settings = {
  timezone: 'America/New_York',
  locale: 'en-US',
  dateFormat: 'MM/DD/YYYY',
  currency: 'USD',
  notificationsEnabled: true
};
```

## Security

### Tenant Context

```typescript
// Get tenant from request
function getTenantContext(request: Request): Tenant {
  const tenant = getTenantFromRequest(request);

  if (!tenant) {
    throw new Error('Tenant not found');
  }

  // Verify tenant is active
  if (tenant.status !== 'active' && tenant.status !== 'trial') {
    throw new Error('Tenant suspended');
  }

  return tenant;
}
```

### Access Control

```typescript
// Check user belongs to tenant
if (user.tenantId !== tenant.id) {
  throw new Error('Unauthorized');
}

// Check user has required role
if (!['owner', 'admin'].includes(user.role)) {
  throw new Error('Insufficient permissions');
}
```

### Rate Limiting

```typescript
// Per-tenant rate limiting
const rateLimiter = new RateLimiter();

if (!rateLimiter.check(tenant.id, tenant.limits.maxApiCalls)) {
  return Response.json({
    error: 'Rate limit exceeded'
  }, { status: 429 });
}
```

## Monitoring

### Metrics to Track

- **Tenants**: Total, active, trial, suspended
- **Usage**: API calls, storage, bandwidth per tenant
- **Revenue**: MRR, ARR, churn rate
- **Performance**: Response time per tenant
- **Errors**: Error rate per tenant

### Health Checks

```typescript
// Per-tenant health check
const health = {
  tenantId: tenant.id,
  status: tenant.status,
  usageWithinLimits: !limitCheck.exceeded,
  subscriptionValid: tenant.subscriptionEndsAt > Date.now(),
  paymentStatus: 'current'
};
```

## Deployment

### Environment Variables

```bash
# Database
DATABASE_URL=postgresql://...

# Billing
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Limits
DEFAULT_MAX_USERS=10
DEFAULT_MAX_STORAGE=10737418240

# Features
ENABLE_CUSTOM_DOMAINS=true
ENABLE_SSO=true
```

### Docker

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3000
CMD ["elide", "run", "server.ts"]
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
        image: saas-backend:latest
        ports:
        - containerPort: 3000
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: database-secret
              key: url
```

## Running the Server

```bash
# Start server
elide run server.ts

# Server runs on http://localhost:3000
```

## Testing

### Create Test Tenant

```bash
curl -X POST http://localhost:3000/admin/tenants \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Corp",
    "slug": "test",
    "plan": "starter",
    "billingCycle": "monthly"
  }'
```

### Test Tenant API

```bash
# Get tenant info
curl http://localhost:3000/api/tenant \
  -H "X-Tenant-Id: tenant_123"

# Get usage
curl http://localhost:3000/api/usage \
  -H "X-Tenant-Id: tenant_123"
```

## Best Practices

1. **Isolate Tenant Data**: Never mix tenant data
2. **Validate Tenant Context**: Always verify tenant on each request
3. **Track Usage**: Monitor usage for billing and limits
4. **Implement Soft Deletes**: Never hard delete tenant data
5. **Backup Regularly**: Per-tenant backups for data recovery
6. **Monitor Performance**: Track per-tenant performance metrics
7. **Use Feature Flags**: Enable/disable features per tenant
8. **Implement Quotas**: Enforce usage limits strictly
9. **Audit Logging**: Log all tenant operations
10. **Plan for Scale**: Design for thousands of tenants

## Further Reading

- [Multi-Tenancy Architecture Patterns](https://docs.microsoft.com/en-us/azure/architecture/guide/multitenant/overview)
- [SaaS Metrics](https://www.klipfolio.com/resources/kpi-examples/saas)
- [Stripe Billing Integration](https://stripe.com/docs/billing)
- [Row-Level Security](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
