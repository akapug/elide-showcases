# Payment Processing Gateway

A production-ready payment processing gateway built with TypeScript that provides secure payment processing, fraud detection, multiple payment provider support, webhook management, and comprehensive refund/chargeback handling.

## Features

### 💳 Card Tokenization
- PCI-DSS compliant tokenization approach
- Secure card data encryption
- Luhn algorithm validation
- Automatic card brand detection (Visa, Mastercard, Amex, Discover, etc.)
- Last 4 digits storage for display
- Token-based payment method storage

### 🛡️ Fraud Detection
- Real-time fraud scoring
- Multiple fraud check layers:
  - Velocity checking (transaction frequency)
  - Amount anomaly detection
  - Geographic location validation
  - Device fingerprinting
  - Blacklist verification
- Configurable risk thresholds
- Automatic transaction blocking for high-risk payments

### 🌐 Multiple Payment Providers
- Provider abstraction layer
- Support for Stripe, Braintree, Adyen, and more
- Automatic provider selection based on capabilities
- Failover and redundancy
- Provider priority management
- Unified API across providers

### 🔔 Webhook Management
- Event-based notifications
- HMAC signature verification
- Automatic retry with exponential backoff
- Delivery tracking and monitoring
- Multiple webhook endpoints per event
- Event filtering

### 💰 Refunds & Chargebacks
- Full and partial refunds
- Automated refund processing
- Chargeback management
- Evidence submission
- Dispute tracking
- Settlement reconciliation

### 📊 Additional Features
- Customer management
- Payment method storage
- Transaction history and ledger
- 3D Secure authentication support
- Multi-currency support
- Metadata and tagging
- Comprehensive audit logs

## Architecture

```
┌─────────────┐
│   Client    │
└──────┬──────┘
       │
       v
┌──────────────┐
│Payment Server│
└──────┬───────┘
       │
   ┌───┼────────┬──────────┬──────────┐
   │   │        │          │          │
┌──▼──┐│  ┌────▼────┐ ┌───▼────┐ ┌──▼────┐
│Token││  │  Fraud  │ │Provider│ │Webhook│
│izer ││  │Detector │ │Adapter │ │Manager│
└─────┘│  └─────────┘ └────┬───┘ └───────┘
       │                   │
       v                   v
┌──────────────┐    ┌──────────────┐
│   Gateway    │    │   Stripe     │
│   Database   │    │  Braintree   │
└──────────────┘    │   Adyen      │
                    └──────────────┘
```

## API Reference

### Create Customer
```http
POST /customers
Content-Type: application/json

{
  "email": "customer@example.com",
  "name": "John Doe",
  "metadata": {
    "source": "web",
    "campaign": "summer2025"
  }
}

Response:
{
  "id": "cus_abc123",
  "email": "customer@example.com",
  "name": "John Doe",
  "paymentMethods": [],
  "metadata": { ... },
  "createdAt": "2025-01-01T00:00:00Z"
}
```

### Add Payment Method
```http
POST /customers/:customerId/payment-methods
Content-Type: application/json

{
  "customerId": "cus_abc123",
  "cardData": {
    "number": "4242424242424242",
    "expiryMonth": 12,
    "expiryYear": 2025,
    "cvv": "123",
    "holderName": "John Doe"
  },
  "isDefault": true
}

Response:
{
  "id": "pm_xyz789",
  "customerId": "cus_abc123",
  "type": "card",
  "token": "tok_encrypted",
  "last4": "4242",
  "brand": "visa",
  "expiryMonth": 12,
  "expiryYear": 2025,
  "isDefault": true,
  "createdAt": "2025-01-01T00:00:00Z"
}
```

### Create Transaction
```http
POST /transactions
Content-Type: application/json

{
  "customerId": "cus_abc123",
  "amount": 9999,
  "currency": "usd",
  "paymentMethodId": "pm_xyz789",
  "description": "Premium subscription",
  "metadata": {
    "orderId": "ORD-12345",
    "productId": "prod_premium"
  }
}

Response:
{
  "id": "txn_def456",
  "customerId": "cus_abc123",
  "amount": 9999,
  "currency": "usd",
  "status": "succeeded",
  "paymentMethodId": "pm_xyz789",
  "provider": "stripe",
  "providerTransactionId": "stripe_ch_abc123",
  "description": "Premium subscription",
  "fraudScore": 15,
  "fraudChecks": [
    {
      "type": "velocity",
      "result": "pass",
      "score": 0,
      "details": { "transactionCount": 1 }
    }
  ],
  "createdAt": "2025-01-01T00:00:00Z",
  "capturedAt": "2025-01-01T00:00:01Z"
}
```

### Create Refund
```http
POST /transactions/:transactionId/refunds
Content-Type: application/json

{
  "transactionId": "txn_def456",
  "amount": 9999,
  "reason": "customer_request"
}

Response:
{
  "id": "ref_ghi789",
  "transactionId": "txn_def456",
  "amount": 9999,
  "reason": "customer_request",
  "status": "succeeded",
  "createdAt": "2025-01-01T00:00:00Z",
  "processedAt": "2025-01-01T00:00:02Z"
}
```

### Get Transaction
```http
GET /transactions/:transactionId

Response:
{
  "id": "txn_def456",
  "customerId": "cus_abc123",
  "amount": 9999,
  "status": "succeeded",
  ...
}
```

### Register Webhook
```http
POST /webhooks
Content-Type: application/json

{
  "url": "https://example.com/webhooks/payment",
  "events": [
    "transaction.created",
    "transaction.succeeded",
    "transaction.failed",
    "refund.created"
  ]
}

Response:
{
  "id": "wh_jkl012",
  "url": "https://example.com/webhooks/payment",
  "events": ["transaction.created", ...],
  "secret": "whsec_abc123...",
  "active": true,
  "createdAt": "2025-01-01T00:00:00Z"
}
```

## Webhook Events

### Event Types
- `transaction.created` - Transaction initiated
- `transaction.succeeded` - Payment successful
- `transaction.failed` - Payment failed
- `refund.created` - Refund initiated
- `refund.succeeded` - Refund processed
- `chargeback.created` - Chargeback filed

### Webhook Payload
```json
{
  "id": "evt_abc123",
  "type": "transaction.succeeded",
  "created": 1640995200,
  "data": {
    "object": {
      "id": "txn_def456",
      "amount": 9999,
      "currency": "usd",
      "status": "succeeded",
      ...
    }
  }
}
```

### Signature Verification
```typescript
import { createHmac } from 'crypto';

function verifyWebhook(payload: string, signature: string, secret: string): boolean {
  const expectedSignature = createHmac('sha256', secret)
    .update(payload)
    .digest('hex');

  return signature === expectedSignature;
}

// Usage
app.post('/webhooks/payment', (req, res) => {
  const signature = req.headers['x-webhook-signature'];
  const isValid = verifyWebhook(
    JSON.stringify(req.body),
    signature,
    'whsec_abc123...'
  );

  if (!isValid) {
    return res.status(400).send('Invalid signature');
  }

  // Process webhook
  res.status(200).send('OK');
});
```

## Usage

### Installation
```bash
npm install
```

### Running the Server
```bash
# Development
npm run dev

# Production
npm run build
npm start
```

### Client Integration

```typescript
import axios from 'axios';

const API_URL = 'http://localhost:3003';

// Create customer
const customer = await axios.post(`${API_URL}/customers`, {
  email: 'customer@example.com',
  name: 'John Doe',
});

// Add payment method
const paymentMethod = await axios.post(
  `${API_URL}/customers/${customer.data.id}/payment-methods`,
  {
    customerId: customer.data.id,
    cardData: {
      number: '4242424242424242',
      expiryMonth: 12,
      expiryYear: 2025,
      cvv: '123',
      holderName: 'John Doe',
    },
    isDefault: true,
  }
);

// Process payment
const transaction = await axios.post(`${API_URL}/transactions`, {
  customerId: customer.data.id,
  amount: 9999,
  currency: 'usd',
  paymentMethodId: paymentMethod.data.id,
  description: 'Premium subscription',
});

console.log('Payment status:', transaction.data.status);
console.log('Fraud score:', transaction.data.fraudScore);

// Issue refund
if (transaction.data.status === 'succeeded') {
  const refund = await axios.post(
    `${API_URL}/transactions/${transaction.data.id}/refunds`,
    {
      transactionId: transaction.data.id,
      amount: 9999,
      reason: 'customer_request',
    }
  );

  console.log('Refund status:', refund.data.status);
}
```

## Configuration

### Environment Variables
```env
PORT=3003
NODE_ENV=production

# Encryption
ENCRYPTION_KEY=your-encryption-key-here
TOKEN_SECRET=your-token-secret-here

# Payment Providers
STRIPE_API_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

BRAINTREE_MERCHANT_ID=...
BRAINTREE_PUBLIC_KEY=...
BRAINTREE_PRIVATE_KEY=...

ADYEN_API_KEY=...
ADYEN_MERCHANT_ACCOUNT=...

# Fraud Detection
FRAUD_SCORE_THRESHOLD=80
VELOCITY_LIMIT=10
AMOUNT_DEVIATION_THRESHOLD=5

# Webhooks
WEBHOOK_MAX_RETRIES=5
WEBHOOK_RETRY_DELAY=2000

# Database
DATABASE_URL=postgresql://user:pass@localhost/payments
REDIS_URL=redis://localhost:6379
```

## Production Deployment

### Database Schema
```sql
-- Customers
CREATE TABLE customers (
  id VARCHAR(50) PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  metadata JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Payment Methods
CREATE TABLE payment_methods (
  id VARCHAR(50) PRIMARY KEY,
  customer_id VARCHAR(50) REFERENCES customers(id),
  type VARCHAR(50),
  token VARCHAR(255),
  last4 VARCHAR(4),
  brand VARCHAR(50),
  expiry_month INTEGER,
  expiry_year INTEGER,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Transactions
CREATE TABLE transactions (
  id VARCHAR(50) PRIMARY KEY,
  customer_id VARCHAR(50) REFERENCES customers(id),
  amount INTEGER NOT NULL,
  currency VARCHAR(3),
  status VARCHAR(20),
  payment_method_id VARCHAR(50),
  provider VARCHAR(50),
  provider_transaction_id VARCHAR(255),
  description TEXT,
  fraud_score INTEGER,
  fraud_checks JSONB,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  captured_at TIMESTAMP,
  refunded_at TIMESTAMP
);
CREATE INDEX idx_transactions_customer ON transactions(customer_id);
CREATE INDEX idx_transactions_status ON transactions(status);

-- Refunds
CREATE TABLE refunds (
  id VARCHAR(50) PRIMARY KEY,
  transaction_id VARCHAR(50) REFERENCES transactions(id),
  amount INTEGER NOT NULL,
  reason VARCHAR(255),
  status VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  processed_at TIMESTAMP
);

-- Webhooks
CREATE TABLE webhooks (
  id VARCHAR(50) PRIMARY KEY,
  url VARCHAR(500),
  events TEXT[],
  secret VARCHAR(255),
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Webhook Deliveries
CREATE TABLE webhook_deliveries (
  id VARCHAR(50) PRIMARY KEY,
  webhook_id VARCHAR(50) REFERENCES webhooks(id),
  event VARCHAR(100),
  payload JSONB,
  status VARCHAR(20),
  attempts INTEGER DEFAULT 0,
  last_attempt_at TIMESTAMP,
  next_retry_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### PCI-DSS Compliance

**IMPORTANT**: This example uses simplified tokenization for demonstration. For production:

1. **Never store raw card data** on your servers
2. **Use a PCI-compliant vault** (e.g., Stripe, Braintree, or dedicated vaults)
3. **Implement proper encryption** (AES-256) for sensitive data
4. **Use TLS/SSL** for all communications
5. **Maintain PCI-DSS compliance** if handling card data
6. **Regular security audits** and penetration testing

### Docker Deployment
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY . .
RUN npm run build
EXPOSE 3003
CMD ["node", "dist/server.js"]
```

### Kubernetes Deployment
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: payment-gateway
spec:
  replicas: 3
  template:
    spec:
      containers:
      - name: gateway
        image: payment-gateway:latest
        ports:
        - containerPort: 3003
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: db-credentials
              key: url
        - name: STRIPE_API_KEY
          valueFrom:
            secretKeyRef:
              name: payment-secrets
              key: stripe-key
        resources:
          requests:
            memory: "512Mi"
            cpu: "500m"
          limits:
            memory: "2Gi"
            cpu: "2000m"
```

## Security

### Best Practices
1. **PCI-DSS Compliance**: Use certified payment processors
2. **Encryption**: Encrypt all sensitive data at rest and in transit
3. **Token Management**: Rotate tokens regularly
4. **Rate Limiting**: Prevent brute force attacks
5. **Input Validation**: Validate all inputs thoroughly
6. **Audit Logging**: Log all payment operations
7. **Fraud Prevention**: Implement multi-layer fraud detection
8. **Secure Webhooks**: Always verify webhook signatures
9. **Secret Management**: Use services like AWS Secrets Manager
10. **Regular Updates**: Keep dependencies updated

## Monitoring

### Key Metrics
- Transaction success rate
- Average transaction amount
- Fraud detection rate
- Provider response time
- Refund rate
- Chargeback rate
- Webhook delivery success rate

### Alerts
- High fraud score transactions
- Payment provider failures
- Webhook delivery failures
- Unusual transaction patterns
- Chargeback notifications

## Testing

### Test Cards
```
Visa (Success): 4242424242424242
Visa (Decline): 4000000000000002
Mastercard (Success): 5555555555554444
Amex (Success): 378282246310005
Discover (Success): 6011111111111117
```

### Example Tests
```typescript
describe('PaymentGateway', () => {
  it('should process successful payment', async () => {
    const gateway = new PaymentGateway();

    const customer = gateway.createCustomer('test@example.com', 'Test User');
    const paymentMethod = gateway.addPaymentMethod(customer.id, {
      number: '4242424242424242',
      expiryMonth: 12,
      expiryYear: 2025,
      cvv: '123',
      holderName: 'Test User',
    });

    const transaction = await gateway.createTransaction(
      customer.id,
      1000,
      'usd',
      paymentMethod.id,
      'Test payment'
    );

    expect(transaction.status).toBe('succeeded');
  });
});
```

## License

MIT

## Support

For issues and questions, please open an issue on GitHub or contact support@example.com.
