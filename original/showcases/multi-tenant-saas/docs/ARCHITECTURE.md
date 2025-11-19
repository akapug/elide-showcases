# Multi-Tenant SaaS Platform - Architecture Documentation

## Overview

This document describes the architecture of a production-grade multi-tenant Software-as-a-Service (SaaS) platform built with Elide. The platform demonstrates advanced patterns for building scalable, secure, and feature-rich SaaS applications with comprehensive billing, analytics, and ML capabilities.

## Table of Contents

1. [System Architecture](#system-architecture)
2. [Multi-Tenancy Model](#multi-tenancy-model)
3. [Billing System](#billing-system)
4. [Analytics & Reporting](#analytics--reporting)
5. [Machine Learning](#machine-learning)
6. [Security](#security)
7. [Data Architecture](#data-architecture)
8. [API Design](#api-design)
9. [Infrastructure](#infrastructure)
10. [Monitoring & Observability](#monitoring--observability)

---

## System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Load Balancer                             │
└────────────────┬────────────────────────────────────────────────┘
                 │
    ┌────────────┴────────────┐
    │                         │
┌───▼────┐              ┌────▼────┐
│  CDN   │              │   WAF   │
└───┬────┘              └────┬────┘
    │                        │
    └────────────┬───────────┘
                 │
    ┌────────────▼────────────┐
    │   API Gateway (Elide)   │
    │  - Rate Limiting        │
    │  - Authentication       │
    │  - Request Routing      │
    └────────────┬────────────┘
                 │
    ┌────────────┴────────────────────────┐
    │                                     │
┌───▼─────────────┐              ┌──────▼──────────┐
│  Application    │              │    Background   │
│    Servers      │◄────────────►│      Jobs       │
│  (TypeScript)   │              │   (Workers)     │
└───┬─────────────┘              └────────┬────────┘
    │                                     │
    ├──────────┬──────────┬──────────────┤
    │          │          │              │
┌───▼───┐  ┌──▼───┐  ┌───▼────┐    ┌───▼────┐
│  DB   │  │Cache │  │ Queue  │    │   ML   │
│(Multi │  │Redis │  │RabbitMQ│    │Service │
│Tenant)│  │      │  │        │    │(Python)│
└───────┘  └──────┘  └────────┘    └────────┘
```

### Component Overview

#### API Gateway
- Built on Elide runtime
- Handles all HTTP/HTTPS traffic
- Implements rate limiting per tenant
- JWT-based authentication
- Request/response transformation
- API versioning support

#### Application Servers
- Stateless TypeScript/Node.js services
- Horizontal scaling capability
- Multi-tenant request handling
- Business logic execution
- Integration with external services

#### Background Jobs
- Asynchronous task processing
- Scheduled job execution
- Email/notification sending
- Data aggregation
- Report generation

#### Machine Learning Services
- Python-based ML models
- Churn prediction
- Pricing optimization
- Usage forecasting
- Customer segmentation

---

## Multi-Tenancy Model

### Isolation Strategies

We support three isolation levels to meet different security and performance requirements:

#### 1. Shared Schema (Row-Level Security)
```sql
-- Every table includes tenant_id
CREATE TABLE projects (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    name VARCHAR(255),
    created_at TIMESTAMP,
    CONSTRAINT fk_tenant FOREIGN KEY (tenant_id)
        REFERENCES tenants(id) ON DELETE CASCADE
);

-- Row-Level Security Policy
CREATE POLICY tenant_isolation ON projects
    USING (tenant_id = current_setting('app.tenant_id')::UUID);
```

**Advantages:**
- Cost-effective for many small tenants
- Simple maintenance
- Efficient resource utilization

**Disadvantages:**
- Requires careful query design
- Potential for data leakage if misconfigured
- Limited customization per tenant

#### 2. Separate Schema (Same Database)
```sql
-- Each tenant gets their own schema
CREATE SCHEMA tenant_abc123;
CREATE SCHEMA tenant_def456;

-- Tables in each schema
CREATE TABLE tenant_abc123.projects (
    id UUID PRIMARY KEY,
    name VARCHAR(255),
    created_at TIMESTAMP
);
```

**Advantages:**
- Strong logical isolation
- Easier backup/restore per tenant
- Per-tenant customization possible

**Disadvantages:**
- More complex maintenance
- Schema migration complexity
- Connection pooling challenges

#### 3. Separate Database (Dedicated)
```
Database: tenant_abc123_db
Database: tenant_def456_db
```

**Advantages:**
- Maximum isolation and security
- Independent scaling
- Custom configuration per tenant
- Easier compliance (HIPAA, SOC 2)

**Disadvantages:**
- Higher infrastructure costs
- Complex backup strategies
- Operational overhead

### Tenant Context Management

Every request must establish tenant context:

```typescript
class TenantContextMiddleware {
  async handle(req: Request, res: Response, next: NextFunction) {
    // Extract tenant from JWT, subdomain, or header
    const tenantId = this.extractTenantId(req);

    // Validate tenant exists and is active
    const tenant = await this.tenantRepository.findById(tenantId);
    if (!tenant || tenant.status !== 'active') {
      return res.status(403).json({ error: 'Invalid tenant' });
    }

    // Set context for this request
    req.tenantContext = {
      tenantId: tenant.id,
      isolationLevel: tenant.isolationLevel,
      quotas: tenant.quotas
    };

    // Set database context
    if (tenant.isolationLevel === 'shared') {
      await this.db.query(
        `SET app.tenant_id = $1`,
        [tenant.id]
      );
    } else if (tenant.isolationLevel === 'schema') {
      await this.db.query(
        `SET search_path TO tenant_${tenant.id}`,
        []
      );
    }

    next();
  }
}
```

### Cross-Tenant Operations

Only super admins can perform cross-tenant operations:

```typescript
class TenantAggregationService {
  @RequiresSuperAdmin()
  async getGlobalMetrics(): Promise<GlobalMetrics> {
    // Bypass tenant isolation for admin queries
    const metrics = await this.db.query(`
      SELECT
        COUNT(DISTINCT tenant_id) as total_tenants,
        SUM(mrr) as total_mrr,
        AVG(user_count) as avg_users_per_tenant
      FROM tenant_metrics
    `);

    return metrics;
  }
}
```

---

## Billing System

### Subscription Management

#### Subscription Lifecycle

```
┌──────────┐     ┌──────────┐     ┌─────────┐     ┌───────────┐
│  Trial   │────►│  Active  │────►│Past Due │────►│ Cancelled │
└──────────┘     └──────────┘     └─────────┘     └───────────┘
     │                 │                │
     │                 │                ▼
     │                 │           ┌────────┐
     └─────────────────┴──────────►│ Paused │
                                   └────────┘
```

#### Subscription Plans

```typescript
interface SubscriptionPlan {
  id: string;
  name: string;
  tier: 'free' | 'starter' | 'professional' | 'business' | 'enterprise';
  pricing: {
    basePrice: number;
    currency: string;
    interval: 'monthly' | 'quarterly' | 'annual';
    includedSeats: number;
    additionalSeatPrice: number;
  };
  features: {
    apiCalls: number | 'unlimited';
    storage: number | 'unlimited';
    support: 'email' | 'priority' | '24/7';
    sla: number; // Uptime percentage
  };
  limits: {
    projects: number | 'unlimited';
    integrations: number | 'unlimited';
    customDomains: number;
  };
}
```

### Invoice Generation

#### Invoice Components

```typescript
interface Invoice {
  id: string;
  number: string; // INV-202401-001234
  subscription: SubscriptionReference;
  lineItems: InvoiceLineItem[];
  calculations: {
    subtotal: number;
    discounts: number;
    tax: number;
    total: number;
  };
  payment: {
    status: 'pending' | 'paid' | 'failed';
    method: string;
    attempts: PaymentAttempt[];
  };
  dates: {
    issued: Date;
    due: Date;
    paid?: Date;
  };
}
```

#### Proration Logic

When customers upgrade or downgrade mid-cycle:

```typescript
function calculateProration(
  subscription: Subscription,
  newPlan: Plan,
  changeDate: Date
): ProrationResult {
  const remainingDays = differenceInDays(
    subscription.currentPeriodEnd,
    changeDate
  );

  const totalDays = differenceInDays(
    subscription.currentPeriodEnd,
    subscription.currentPeriodStart
  );

  // Credit for unused time on old plan
  const currentDailyCost = subscription.totalPrice / totalDays;
  const creditAmount = currentDailyCost * remainingDays;

  // Charge for new plan (prorated)
  const newDailyCost = newPlan.totalPrice / totalDays;
  const chargeAmount = newDailyCost * remainingDays;

  return {
    creditAmount,
    chargeAmount,
    netAmount: chargeAmount - creditAmount,
    effectiveDate: changeDate
  };
}
```

### Usage-Based Billing

For metered features (API calls, storage, etc.):

```typescript
class UsageMeteringService {
  async recordUsage(params: {
    tenantId: string;
    metric: string;
    quantity: number;
    timestamp: Date;
  }): Promise<void> {
    // Write to time-series database
    await this.timeseries.write({
      measurement: 'usage',
      tags: {
        tenant_id: params.tenantId,
        metric: params.metric
      },
      fields: {
        quantity: params.quantity
      },
      timestamp: params.timestamp
    });

    // Check if approaching quota
    await this.checkQuota(params.tenantId, params.metric);
  }

  async aggregateUsageForBilling(
    tenantId: string,
    periodStart: Date,
    periodEnd: Date
  ): Promise<UsageSummary> {
    const usage = await this.timeseries.query(`
      SELECT
        metric,
        SUM(quantity) as total_quantity
      FROM usage
      WHERE tenant_id = '${tenantId}'
        AND time >= '${periodStart.toISOString()}'
        AND time < '${periodEnd.toISOString()}'
      GROUP BY metric
    `);

    return usage;
  }
}
```

### Payment Processing

```typescript
class PaymentProcessor {
  async processPayment(invoice: Invoice): Promise<PaymentResult> {
    try {
      // Attempt payment with stored method
      const charge = await this.paymentGateway.charge({
        amount: invoice.total,
        currency: invoice.currency,
        paymentMethod: invoice.paymentMethodId,
        metadata: {
          invoiceId: invoice.id,
          tenantId: invoice.tenantId
        }
      });

      if (charge.status === 'succeeded') {
        await this.markInvoiceAsPaid(invoice.id);
        await this.emit('payment:succeeded', { invoice, charge });
        return { success: true, transactionId: charge.id };
      }
    } catch (error) {
      // Initiate dunning process
      await this.dunningService.handleFailedPayment(invoice);
      await this.emit('payment:failed', { invoice, error });
      return { success: false, error };
    }
  }
}
```

---

## Analytics & Reporting

### Data Warehouse Architecture

```
┌──────────────────────────────────────────────────┐
│           Operational Databases                   │
│  (PostgreSQL, MongoDB, Redis)                    │
└──────────────┬───────────────────────────────────┘
               │ ETL Pipeline
               │ (Every 15 minutes)
               ▼
┌──────────────────────────────────────────────────┐
│              Data Warehouse                       │
│  (Snowflake / BigQuery / Redshift)              │
│                                                   │
│  - Fact Tables (usage, revenue, events)         │
│  - Dimension Tables (tenants, users, plans)     │
│  - Aggregated Views (daily, weekly, monthly)    │
└──────────────┬───────────────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────────────┐
│          Analytics & BI Tools                     │
│  - Custom Dashboards                             │
│  - Tableau / Looker Integration                  │
│  - API for Embedded Analytics                    │
└──────────────────────────────────────────────────┘
```

### Key Metrics

#### SaaS Metrics
- **MRR (Monthly Recurring Revenue)**: Predictable monthly revenue
- **ARR (Annual Recurring Revenue)**: MRR × 12
- **ARPU (Average Revenue Per User)**: Total revenue / active customers
- **LTV (Lifetime Value)**: Average customer lifetime × ARPU
- **CAC (Customer Acquisition Cost)**: Sales & marketing spend / new customers
- **Churn Rate**: Lost customers / total customers at period start

#### Product Metrics
- **DAU/MAU**: Daily/Monthly Active Users
- **Stickiness**: DAU / MAU (higher is better)
- **Feature Adoption**: % of users using key features
- **Time to First Value**: Time from signup to first meaningful action
- **NPS (Net Promoter Score)**: Customer satisfaction metric

### Real-Time Analytics

```typescript
class RealTimeAnalytics {
  private metricsBuffer: Map<string, Metric[]> = new Map();

  async trackEvent(event: AnalyticsEvent): Promise<void> {
    // Write to fast path (Redis)
    await this.redis.zadd(
      `events:${event.tenantId}:${event.type}`,
      event.timestamp.getTime(),
      JSON.stringify(event)
    );

    // Buffer for batch processing
    if (!this.metricsBuffer.has(event.tenantId)) {
      this.metricsBuffer.set(event.tenantId, []);
    }

    this.metricsBuffer.get(event.tenantId)!.push({
      metric: event.type,
      value: event.value,
      timestamp: event.timestamp
    });

    // Flush when buffer reaches threshold
    if (this.metricsBuffer.get(event.tenantId)!.length >= 100) {
      await this.flushMetrics(event.tenantId);
    }
  }

  async getDashboard(tenantId: string): Promise<Dashboard> {
    // Combine real-time and historical data
    const realtime = await this.getRealTimeMetrics(tenantId);
    const historical = await this.warehouse.query(
      `SELECT * FROM tenant_metrics WHERE tenant_id = $1`,
      [tenantId]
    );

    return {
      realtime,
      historical,
      summary: this.calculateSummary(realtime, historical)
    };
  }
}
```

---

## Machine Learning

### Churn Prediction Model

#### Feature Engineering

```python
class ChurnFeatureEngineering:
    """Extract features for churn prediction"""

    def engineer_features(self, tenant_data: pd.DataFrame) -> pd.DataFrame:
        features = pd.DataFrame()

        # Usage patterns
        features['avg_daily_api_calls'] = tenant_data.groupby('tenant_id')['api_calls'].mean()
        features['usage_trend'] = self.calculate_trend(tenant_data, 'api_calls')
        features['days_since_last_login'] = (datetime.now() - tenant_data['last_login']).dt.days

        # Engagement metrics
        features['feature_adoption_rate'] = tenant_data['features_used'] / tenant_data['total_features']
        features['support_tickets'] = tenant_data['support_tickets_count']
        features['support_satisfaction'] = tenant_data['support_rating'].mean()

        # Billing indicators
        features['payment_failures'] = tenant_data['failed_payments'].sum()
        features['plan_downgrades'] = (tenant_data['plan_changes'] == 'downgrade').sum()
        features['subscription_age_days'] = (datetime.now() - tenant_data['subscription_start']).dt.days

        # Behavioral signals
        features['cancellation_page_visits'] = tenant_data['cancel_page_views'].sum()
        features['negative_feedback'] = tenant_data['negative_feedback_count']

        return features
```

#### Model Architecture

```python
class ChurnPredictionModel:
    """Ensemble model for churn prediction"""

    def __init__(self):
        # Multiple models in ensemble
        self.rf_model = RandomForestClassifier(n_estimators=100)
        self.xgb_model = XGBClassifier(n_estimators=100)
        self.nn_model = self.build_neural_network()

    def train(self, X: pd.DataFrame, y: pd.Series):
        # Train each model
        self.rf_model.fit(X, y)
        self.xgb_model.fit(X, y)
        self.nn_model.fit(X, y, epochs=50)

    def predict_proba(self, X: pd.DataFrame) -> np.ndarray:
        # Ensemble prediction (weighted average)
        rf_pred = self.rf_model.predict_proba(X)[:, 1]
        xgb_pred = self.xgb_model.predict_proba(X)[:, 1]
        nn_pred = self.nn_model.predict(X).flatten()

        # Weighted average
        ensemble_pred = (
            0.35 * rf_pred +
            0.40 * xgb_pred +
            0.25 * nn_pred
        )

        return ensemble_pred
```

#### Model Deployment

```typescript
class ChurnPredictionService {
  private mlService: MLServiceClient;

  async predictChurnRisk(tenantId: string): Promise<ChurnPrediction> {
    // Extract features
    const features = await this.extractFeatures(tenantId);

    // Call ML service
    const response = await this.mlService.predict({
      model: 'churn_prediction_v2',
      features: features
    });

    // Interpret results
    const churnProbability = response.probability;
    const riskLevel = this.determineRiskLevel(churnProbability);

    // Generate interventions
    const interventions = await this.recommendInterventions(
      tenantId,
      riskLevel,
      response.feature_importance
    );

    return {
      tenantId,
      churnProbability,
      riskLevel,
      topRiskFactors: response.top_factors,
      recommendedInterventions: interventions,
      confidenceScore: response.confidence
    };
  }
}
```

### Pricing Optimization

```python
class PricingOptimizer:
    """ML-based dynamic pricing optimization"""

    def optimize_price(
        self,
        customer_profile: CustomerProfile,
        market_data: MarketData
    ) -> PriceRecommendation:
        # Estimate willingness to pay
        wtp = self.estimate_wtp(customer_profile)

        # Calculate price elasticity
        elasticity = self.calculate_elasticity(
            customer_profile.segment,
            market_data
        )

        # Optimize for revenue/profit
        optimal_price = self.maximize_objective(
            wtp=wtp,
            elasticity=elasticity,
            current_price=customer_profile.current_price,
            objective='revenue'
        )

        # Calculate confidence intervals
        confidence = self.calculate_confidence(
            customer_profile,
            optimal_price
        )

        return PriceRecommendation(
            recommended_price=optimal_price,
            expected_revenue_lift=self.estimate_lift(
                customer_profile,
                optimal_price
            ),
            confidence=confidence,
            risk_assessment=self.assess_risk(
                customer_profile,
                optimal_price
            )
        )
```

---

## Security

### Authentication & Authorization

#### JWT-Based Authentication

```typescript
interface JWTPayload {
  sub: string; // User ID
  tenant_id: string;
  role: string;
  permissions: string[];
  exp: number;
  iat: number;
}

class AuthenticationService {
  generateToken(user: User, tenant: Tenant): string {
    const payload: JWTPayload = {
      sub: user.id,
      tenant_id: tenant.id,
      role: user.role,
      permissions: this.getUserPermissions(user, tenant),
      exp: Date.now() / 1000 + 3600, // 1 hour
      iat: Date.now() / 1000
    };

    return jwt.sign(payload, process.env.JWT_SECRET!, {
      algorithm: 'RS256'
    });
  }

  async validateToken(token: string): Promise<JWTPayload> {
    try {
      const payload = jwt.verify(
        token,
        process.env.JWT_PUBLIC_KEY!
      ) as JWTPayload;

      // Check if token is revoked
      const isRevoked = await this.redis.get(`revoked:${token}`);
      if (isRevoked) {
        throw new Error('Token has been revoked');
      }

      return payload;
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }
}
```

#### Role-Based Access Control (RBAC)

```typescript
enum Permission {
  // Resource permissions
  READ_PROJECTS = 'projects:read',
  WRITE_PROJECTS = 'projects:write',
  DELETE_PROJECTS = 'projects:delete',

  // Billing permissions
  VIEW_BILLING = 'billing:view',
  MANAGE_BILLING = 'billing:manage',

  // Admin permissions
  MANAGE_USERS = 'users:manage',
  VIEW_ANALYTICS = 'analytics:view',
  MANAGE_INTEGRATIONS = 'integrations:manage',
}

const rolePermissions: Record<string, Permission[]> = {
  owner: [
    // All permissions
    ...Object.values(Permission)
  ],
  admin: [
    Permission.READ_PROJECTS,
    Permission.WRITE_PROJECTS,
    Permission.DELETE_PROJECTS,
    Permission.VIEW_BILLING,
    Permission.MANAGE_USERS,
    Permission.VIEW_ANALYTICS,
  ],
  member: [
    Permission.READ_PROJECTS,
    Permission.WRITE_PROJECTS,
    Permission.VIEW_ANALYTICS,
  ],
  viewer: [
    Permission.READ_PROJECTS,
  ]
};

function hasPermission(user: User, permission: Permission): boolean {
  const userPermissions = rolePermissions[user.role] || [];
  return userPermissions.includes(permission);
}
```

### Data Encryption

#### At Rest

```typescript
class EncryptionService {
  private algorithm = 'aes-256-gcm';

  encrypt(data: string, tenantId: string): EncryptedData {
    // Use tenant-specific key
    const key = this.getTenantKey(tenantId);
    const iv = crypto.randomBytes(16);

    const cipher = crypto.createCipheriv(this.algorithm, key, iv);
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    return {
      encrypted,
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex')
    };
  }

  decrypt(encryptedData: EncryptedData, tenantId: string): string {
    const key = this.getTenantKey(tenantId);
    const decipher = crypto.createDecipheriv(
      this.algorithm,
      key,
      Buffer.from(encryptedData.iv, 'hex')
    );

    decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'hex'));

    let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }
}
```

#### In Transit

All traffic must use TLS 1.3:

```typescript
const httpsServer = https.createServer({
  key: fs.readFileSync('private-key.pem'),
  cert: fs.readFileSync('certificate.pem'),
  minVersion: 'TLSv1.3',
  ciphers: [
    'TLS_AES_256_GCM_SHA384',
    'TLS_CHACHA20_POLY1305_SHA256',
    'TLS_AES_128_GCM_SHA256'
  ].join(':')
}, app);
```

### Audit Logging

```typescript
class AuditLogger {
  async log(event: AuditEvent): Promise<void> {
    const entry: AuditLogEntry = {
      id: generateId(),
      timestamp: new Date(),
      actor: {
        type: event.actorType,
        id: event.actorId,
        ip: event.ipAddress
      },
      action: event.action,
      resource: {
        type: event.resourceType,
        id: event.resourceId
      },
      tenant_id: event.tenantId,
      changes: event.changes,
      metadata: {
        user_agent: event.userAgent,
        session_id: event.sessionId
      }
    };

    // Write to append-only log
    await this.db.query(
      `INSERT INTO audit_logs VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        entry.id,
        entry.timestamp,
        entry.actor,
        entry.action,
        entry.resource,
        entry.tenant_id,
        entry.changes
      ]
    );

    // Also send to SIEM
    await this.siem.send(entry);
  }
}
```

---

## Infrastructure

### Deployment Architecture

```yaml
# Kubernetes Deployment
apiVersion: apps/v1
kind: Deployment
metadata:
  name: saas-api
spec:
  replicas: 5
  selector:
    matchLabels:
      app: saas-api
  template:
    metadata:
      labels:
        app: saas-api
    spec:
      containers:
      - name: api
        image: saas-api:v1.2.3
        resources:
          requests:
            memory: "512Mi"
            cpu: "500m"
          limits:
            memory: "1Gi"
            cpu: "1000m"
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: db-credentials
              key: url
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

### Scaling Strategy

#### Horizontal Pod Autoscaling

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: saas-api-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: saas-api
  minReplicas: 3
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
      - type: Pods
        value: 4
        periodSeconds: 30
```

---

## Monitoring & Observability

### Metrics Collection

```typescript
class MetricsCollector {
  private prometheus: PrometheusClient;

  // Define metrics
  private readonly httpRequestDuration = new Histogram({
    name: 'http_request_duration_seconds',
    help: 'HTTP request duration in seconds',
    labelNames: ['method', 'route', 'status', 'tenant_id']
  });

  private readonly activeSubscriptions = new Gauge({
    name: 'active_subscriptions_total',
    help: 'Number of active subscriptions',
    labelNames: ['plan_tier']
  });

  private readonly revenueCounter = new Counter({
    name: 'revenue_total',
    help: 'Total revenue in USD',
    labelNames: ['plan_tier']
  });

  recordRequest(
    method: string,
    route: string,
    status: number,
    duration: number,
    tenantId: string
  ): void {
    this.httpRequestDuration
      .labels(method, route, status.toString(), tenantId)
      .observe(duration);
  }

  updateSubscriptions(planTier: string, count: number): void {
    this.activeSubscriptions
      .labels(planTier)
      .set(count);
  }
}
```

### Alerting

```yaml
# Prometheus Alerting Rules
groups:
  - name: saas_alerts
    interval: 30s
    rules:
      - alert: HighErrorRate
        expr: |
          sum(rate(http_requests_total{status=~"5.."}[5m]))
          /
          sum(rate(http_requests_total[5m]))
          > 0.05
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "High error rate detected"
          description: "Error rate is {{ $value | humanizePercentage }}"

      - alert: HighChurnRisk
        expr: |
          avg(churn_risk_score) > 0.7
        for: 1h
        labels:
          severity: warning
        annotations:
          summary: "High churn risk detected"

      - alert: LowDatabaseConnections
        expr: |
          pg_stat_database_numbackends < 5
        for: 5m
        labels:
          severity: warning
```

---

## Conclusion

This architecture provides a solid foundation for building a production-grade multi-tenant SaaS platform. Key considerations:

1. **Security First**: Multi-layered security with encryption, RBAC, and audit logging
2. **Scalability**: Horizontal scaling with Kubernetes and efficient data partitioning
3. **Observability**: Comprehensive monitoring and alerting
4. **Revenue Optimization**: Advanced billing and ML-powered pricing
5. **Customer Success**: Churn prediction and proactive interventions

For implementation details, refer to the codebase and additional documentation.
