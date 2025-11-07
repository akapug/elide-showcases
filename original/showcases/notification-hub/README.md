# Multi-Channel Notification Hub

A production-ready notification service built with TypeScript that provides multi-channel delivery (Email, SMS, Push, Webhook), template management, scheduling, delivery tracking, and intelligent rate limiting.

## Features

### 📧 Multi-Channel Support
- **Email**: Integration with SendGrid, AWS SES, Mailgun
- **SMS**: Support for Twilio, AWS SNS, Nexmo
- **Push Notifications**: FCM, APNs, OneSignal
- **Webhooks**: Custom HTTP callbacks
- Unified API across all channels
- Channel fallback and redundancy

### 📝 Template Management
- Dynamic template creation and editing
- Variable substitution with `{{variable}}` syntax
- Multi-language support (i18n)
- Template versioning
- Preview and testing
- Reusable templates across channels

### ⏰ Scheduling & Timing
- Schedule notifications for future delivery
- Delayed notifications
- Quiet hours support
- Timezone-aware scheduling
- Recurring notifications
- Batch scheduling

### 📊 Delivery Tracking
- Real-time delivery status
- Delivery analytics and reporting
- Success/failure tracking
- Retry attempts logging
- Provider response capture
- Historical delivery data

### 🚦 Rate Limiting
- Per-channel rate limits
- Per-user throttling
- Configurable limits (per minute, hour, day)
- Automatic queue management
- Priority-based delivery
- Burst handling

### 👤 User Preferences
- Channel-specific opt-in/opt-out
- Quiet hours configuration
- Delivery frequency control (instant, hourly, daily, weekly digests)
- Per-template opt-outs
- Contact information management

## Architecture

```
┌─────────────┐
│   Client    │
└──────┬──────┘
       │
       v
┌──────────────────┐
│Notification Server│
└────────┬─────────┘
         │
    ┌────┼────┬────────┬─────────┐
    │    │    │        │         │
┌───▼──┐ │ ┌──▼──┐ ┌──▼───┐ ┌──▼───┐
│Queue │ │ │Rate │ │Temp  │ │Prefs │
│      │ │ │Limit│ │late  │ │      │
└───┬──┘ │ └─────┘ └──────┘ └──────┘
    │    │
    v    v
┌────────────────────────────┐
│   Channel Providers        │
│  ┌──────┐ ┌──────┐ ┌────┐│
│  │Email │ │ SMS  │ │Push││
│  └──────┘ └──────┘ └────┘│
└────────────────────────────┘
```

## API Reference

### Send Notification
```http
POST /notifications
Content-Type: application/json

{
  "userId": "user123",
  "channel": "email",
  "message": "Hello {{name}}!",
  "options": {
    "templateId": "welcome-email",
    "variables": {
      "name": "John Doe"
    },
    "subject": "Welcome!",
    "priority": "high",
    "scheduledFor": "2025-01-02T10:00:00Z",
    "metadata": {
      "campaign": "onboarding"
    }
  }
}

Response:
{
  "id": "notif_abc123",
  "userId": "user123",
  "channel": "email",
  "status": "queued",
  "priority": "high",
  "createdAt": "2025-01-01T00:00:00Z"
}
```

### Send Batch Notification
```http
POST /notifications/batch
Content-Type: application/json

{
  "userIds": ["user1", "user2", "user3"],
  "channel": "email",
  "templateId": "newsletter",
  "variables": {
    "user1": { "name": "Alice", "content": "..." },
    "user2": { "name": "Bob", "content": "..." },
    "user3": { "name": "Charlie", "content": "..." }
  },
  "scheduledFor": "2025-01-02T09:00:00Z"
}

Response:
{
  "id": "batch_xyz789",
  "userIds": ["user1", "user2", "user3"],
  "channel": "email",
  "status": "queued",
  "progress": 0,
  "createdAt": "2025-01-01T00:00:00Z"
}
```

### Create Template
```http
POST /templates
Content-Type: application/json

{
  "name": "Welcome Email",
  "channel": "email",
  "subject": "Welcome to {{appName}}!",
  "body": "Hi {{name}},\n\nWelcome to {{appName}}! We're excited to have you.\n\nBest regards,\nThe Team",
  "locale": "en"
}

Response:
{
  "id": "tmpl_def456",
  "name": "Welcome Email",
  "channel": "email",
  "subject": "Welcome to {{appName}}!",
  "body": "Hi {{name}},...",
  "variables": ["appName", "name"],
  "locale": "en",
  "createdAt": "2025-01-01T00:00:00Z",
  "updatedAt": "2025-01-01T00:00:00Z"
}
```

### Get Templates
```http
GET /templates?channel=email

Response:
[
  {
    "id": "tmpl_def456",
    "name": "Welcome Email",
    "channel": "email",
    ...
  }
]
```

### Set User Preferences
```http
POST /users/:userId/preferences
Content-Type: application/json

{
  "userId": "user123",
  "preferences": {
    "channels": {
      "email": {
        "enabled": true,
        "address": "user@example.com"
      },
      "sms": {
        "enabled": false,
        "phoneNumber": "+1234567890"
      },
      "push": {
        "enabled": true,
        "deviceTokens": ["token1", "token2"]
      }
    },
    "optOuts": ["newsletter"],
    "quietHours": {
      "start": "22:00",
      "end": "08:00",
      "timezone": "America/New_York"
    },
    "frequency": "digest_daily"
  }
}

Response:
{
  "userId": "user123",
  "channels": { ... },
  "optOuts": ["newsletter"],
  "quietHours": { ... },
  "frequency": "digest_daily",
  "updatedAt": "2025-01-01T00:00:00Z"
}
```

### Get Delivery Statistics
```http
GET /stats?channel=email

Response:
{
  "total": 1000,
  "queued": 50,
  "sent": 920,
  "failed": 30,
  "cancelled": 0,
  "successRate": 92.0,
  "avgDeliveryTime": 1250
}
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

const API_URL = 'http://localhost:3004';

// Create a template
const template = await axios.post(`${API_URL}/templates`, {
  name: 'Order Confirmation',
  channel: 'email',
  subject: 'Order #{{orderId}} Confirmed',
  body: `
    Hi {{customerName}},

    Your order #{{orderId}} has been confirmed!

    Total: ${{total}}
    Expected Delivery: {{deliveryDate}}

    Thank you for your purchase!
  `,
  locale: 'en',
});

// Send notification using template
const notification = await axios.post(`${API_URL}/notifications`, {
  userId: 'user123',
  channel: 'email',
  message: '',
  options: {
    templateId: template.data.id,
    variables: {
      orderId: 'ORD-12345',
      customerName: 'John Doe',
      total: '99.99',
      deliveryDate: '2025-01-05',
    },
    priority: 'high',
  },
});

// Send batch notifications
const batch = await axios.post(`${API_URL}/notifications/batch`, {
  userIds: ['user1', 'user2', 'user3'],
  channel: 'email',
  templateId: template.data.id,
  variables: {
    user1: { customerName: 'Alice', orderId: 'ORD-001', total: '50.00', deliveryDate: '2025-01-05' },
    user2: { customerName: 'Bob', orderId: 'ORD-002', total: '75.00', deliveryDate: '2025-01-06' },
    user3: { customerName: 'Charlie', orderId: 'ORD-003', total: '120.00', deliveryDate: '2025-01-07' },
  },
});

// Set user preferences
await axios.post(`${API_URL}/users/user123/preferences`, {
  userId: 'user123',
  preferences: {
    channels: {
      email: { enabled: true, address: 'user@example.com' },
      sms: { enabled: true, phoneNumber: '+1234567890' },
      push: { enabled: true, deviceTokens: ['device-token-1'] },
    },
    quietHours: {
      start: '22:00',
      end: '08:00',
      timezone: 'America/New_York',
    },
    frequency: 'instant',
  },
});

// Get delivery stats
const stats = await axios.get(`${API_URL}/stats`);
console.log('Success rate:', stats.data.successRate + '%');
```

## Configuration

### Environment Variables
```env
PORT=3004
NODE_ENV=production

# Email Provider (SendGrid)
SENDGRID_API_KEY=SG.xxx
SENDGRID_FROM_EMAIL=noreply@example.com
SENDGRID_FROM_NAME=Example App

# SMS Provider (Twilio)
TWILIO_ACCOUNT_SID=ACxxx
TWILIO_AUTH_TOKEN=xxx
TWILIO_FROM_NUMBER=+1234567890

# Push Notifications (FCM)
FCM_SERVER_KEY=xxx
FCM_SENDER_ID=xxx

# APNs
APNS_KEY_ID=xxx
APNS_TEAM_ID=xxx
APNS_BUNDLE_ID=com.example.app
APNS_KEY_PATH=/path/to/key.p8

# Rate Limits
EMAIL_RATE_LIMIT_MINUTE=100
EMAIL_RATE_LIMIT_HOUR=1000
EMAIL_RATE_LIMIT_DAY=10000

SMS_RATE_LIMIT_MINUTE=50
SMS_RATE_LIMIT_HOUR=500
SMS_RATE_LIMIT_DAY=5000

# Queue
MAX_CONCURRENT_NOTIFICATIONS=10
RETRY_ATTEMPTS=3
RETRY_DELAY_MS=2000

# Database
DATABASE_URL=postgresql://user:pass@localhost/notifications
REDIS_URL=redis://localhost:6379
```

## Production Deployment

### Database Schema
```sql
-- Templates
CREATE TABLE templates (
  id UUID PRIMARY KEY,
  name VARCHAR(255),
  channel VARCHAR(50),
  subject TEXT,
  body TEXT,
  variables TEXT[],
  locale VARCHAR(10),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Notifications
CREATE TABLE notifications (
  id UUID PRIMARY KEY,
  user_id VARCHAR(255),
  channel VARCHAR(50),
  template_id UUID REFERENCES templates(id),
  subject TEXT,
  message TEXT,
  variables JSONB,
  metadata JSONB,
  scheduled_for TIMESTAMP,
  priority VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Deliveries
CREATE TABLE deliveries (
  id UUID PRIMARY KEY,
  notification_id UUID REFERENCES notifications(id),
  user_id VARCHAR(255),
  channel VARCHAR(50),
  status VARCHAR(20),
  attempts INTEGER DEFAULT 0,
  sent_at TIMESTAMP,
  delivered_at TIMESTAMP,
  failed_at TIMESTAMP,
  error TEXT,
  provider_response JSONB
);
CREATE INDEX idx_deliveries_user ON deliveries(user_id);
CREATE INDEX idx_deliveries_status ON deliveries(status);

-- User Preferences
CREATE TABLE user_preferences (
  user_id VARCHAR(255) PRIMARY KEY,
  channels JSONB,
  opt_outs TEXT[],
  quiet_hours JSONB,
  frequency VARCHAR(50),
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Batch Requests
CREATE TABLE batch_requests (
  id UUID PRIMARY KEY,
  user_ids TEXT[],
  channel VARCHAR(50),
  template_id UUID REFERENCES templates(id),
  variables JSONB,
  scheduled_for TIMESTAMP,
  status VARCHAR(20),
  progress INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Provider Integration

#### SendGrid (Email)
```typescript
import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

async send(to: string, subject: string, body: string) {
  const msg = {
    to,
    from: process.env.SENDGRID_FROM_EMAIL!,
    subject,
    html: body,
  };

  const [response] = await sgMail.send(msg);
  return {
    success: true,
    messageId: response.headers['x-message-id'],
  };
}
```

#### Twilio (SMS)
```typescript
import twilio from 'twilio';

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

async send(to: string, message: string) {
  const result = await client.messages.create({
    body: message,
    from: process.env.TWILIO_FROM_NUMBER,
    to,
  });

  return {
    success: true,
    messageId: result.sid,
  };
}
```

#### Firebase Cloud Messaging (Push)
```typescript
import admin from 'firebase-admin';

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

async send(deviceTokens: string[], title: string, body: string) {
  const message = {
    notification: { title, body },
    tokens: deviceTokens,
  };

  const response = await admin.messaging().sendMulticast(message);
  return {
    success: response.successCount > 0,
    messageId: response.responses[0]?.messageId,
  };
}
```

### Docker Deployment
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY . .
RUN npm run build
EXPOSE 3004
CMD ["node", "dist/server.js"]
```

### Kubernetes Deployment
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: notification-hub
spec:
  replicas: 3
  template:
    spec:
      containers:
      - name: server
        image: notification-hub:latest
        ports:
        - containerPort: 3004
        env:
        - name: SENDGRID_API_KEY
          valueFrom:
            secretKeyRef:
              name: notification-secrets
              key: sendgrid-key
        - name: TWILIO_AUTH_TOKEN
          valueFrom:
            secretKeyRef:
              name: notification-secrets
              key: twilio-token
        resources:
          requests:
            memory: "512Mi"
            cpu: "500m"
          limits:
            memory: "2Gi"
            cpu: "2000m"
```

## Advanced Features

### Digest Notifications
```typescript
// Collect notifications for digest
const digestCollector = new Map<string, NotificationRequest[]>();

// Add to digest instead of sending immediately
if (userPrefs.frequency === 'digest_daily') {
  const userDigest = digestCollector.get(userId) || [];
  userDigest.push(notification);
  digestCollector.set(userId, userDigest);
}

// Send digest at scheduled time
function sendDailyDigest() {
  for (const [userId, notifications] of digestCollector.entries()) {
    const digestMessage = generateDigest(notifications);
    hub.send(userId, 'email', digestMessage, {
      subject: 'Your Daily Digest',
      priority: 'normal',
    });
  }
  digestCollector.clear();
}
```

### A/B Testing
```typescript
// Template variants
const templateA = hub.getTemplateEngine().createTemplate(
  'Welcome Email A',
  'email',
  'Simple welcome message'
);

const templateB = hub.getTemplateEngine().createTemplate(
  'Welcome Email B',
  'email',
  'Detailed welcome with features'
);

// Random variant selection
const variant = Math.random() > 0.5 ? templateA.id : templateB.id;

await hub.send(userId, 'email', '', {
  templateId: variant,
  metadata: { experiment: 'welcome_email', variant },
});
```

### Notification Tracking
```typescript
// Track opens and clicks
app.get('/track/open/:notificationId', (req, res) => {
  const { notificationId } = req.params;
  trackEvent('notification_opened', { notificationId });
  res.sendFile('pixel.gif');
});

app.get('/track/click/:notificationId', (req, res) => {
  const { notificationId, link } = req.params;
  trackEvent('notification_clicked', { notificationId, link });
  res.redirect(link);
});
```

## Monitoring

### Key Metrics
- Delivery success rate by channel
- Average delivery time
- Queue depth and processing rate
- Rate limit hits
- Provider errors
- User opt-out rate
- Template performance

### Health Checks
```typescript
app.get('/health', (req, res) => {
  const queueSize = hub.queue.getQueueSize();
  const stats = hub.getDeliveryStats();

  const health = {
    status: queueSize < 10000 ? 'healthy' : 'degraded',
    queue: {
      size: queueSize,
      processing: hub.queue.getActiveJobs(),
    },
    delivery: {
      successRate: stats.successRate,
      avgDeliveryTime: stats.avgDeliveryTime,
    },
  };

  res.json(health);
});
```

## License

MIT

## Support

For issues and questions, please open an issue on GitHub or contact support@example.com.
