# Edge Analytics Service

A production-grade real-time analytics platform running at the edge, providing event collection, real-time aggregation, session tracking, anomaly detection, and a comprehensive dashboard API.

## Features

### Event Collection
- High-throughput event ingestion
- Multiple event types (pageview, click, conversion, etc.)
- Rich event properties
- Automatic device and geo detection
- Session association
- User identification

### Session Tracking
- Automatic session creation and management
- Session timeout handling (30 minutes)
- Page view counting
- Session duration tracking
- Referrer and landing page capture
- Active session monitoring

### Real-time Aggregation
- Total events and unique metrics
- Event type breakdown
- Device and geographic distribution
- Top pages and content
- Average session duration
- Bounce rate calculation

### Anomaly Detection
- Statistical anomaly detection (Z-score)
- Spike detection
- Real-time monitoring
- Configurable thresholds
- Severity classification
- Historical baseline comparison

### Dashboard API
- RESTful API for dashboards
- Time-series data export
- Funnel analysis
- Real-time metrics
- Session details
- Event filtering

## API Endpoints

### Event Collection

#### Track Event
```
POST /collect
Content-Type: application/json

{
  "type": "pageview",
  "sessionId": "sess_abc123",
  "userId": "user_456",
  "properties": {
    "page": "/products",
    "title": "Products Page",
    "referrer": "https://google.com"
  }
}
```

Response:
```json
{
  "success": true,
  "eventId": "evt_1234567890_abc123"
}
```

### Dashboard API

#### Get Metrics
```
GET /api/metrics
GET /api/metrics?start=1234567890&end=1234567999
```

Response:
```json
{
  "totalEvents": 12456,
  "uniqueSessions": 1024,
  "uniqueUsers": 856,
  "eventsByType": {
    "pageview": 8000,
    "click": 3200,
    "conversion": 456
  },
  "deviceBreakdown": {
    "mobile": 7000,
    "desktop": 4500,
    "tablet": 956
  },
  "geoBreakdown": {
    "US": 6000,
    "GB": 2000,
    "DE": 1500
  },
  "averageSessionDuration": 185000,
  "bounceRate": 42.5,
  "topPages": [
    { "page": "/", "views": 3200 },
    { "page": "/products", "views": 2800 },
    { "page": "/about", "views": 1500 }
  ]
}
```

#### Get Active Sessions
```
GET /api/sessions
```

Response:
```json
[
  {
    "id": "sess_abc123",
    "userId": "user_456",
    "startTime": 1234567890,
    "duration": 45000,
    "pageViews": 5,
    "eventCount": 12,
    "landingPage": "/",
    "referrer": "https://google.com"
  }
]
```

#### Get Events
```
GET /api/events
GET /api/events?type=pageview
GET /api/events?sessionId=sess_abc123
GET /api/events?limit=50
```

Response:
```json
[
  {
    "id": "evt_1234567890_abc123",
    "type": "pageview",
    "timestamp": 1234567890,
    "sessionId": "sess_abc123",
    "userId": "user_456",
    "properties": {
      "page": "/products",
      "title": "Products"
    },
    "geo": {
      "country": "US",
      "region": "CA",
      "city": "San Francisco"
    },
    "device": {
      "type": "mobile",
      "os": "iOS",
      "browser": "Safari"
    }
  }
]
```

#### Get Time Series
```
GET /api/timeseries?metric=events&interval=60000
GET /api/timeseries?metric=pageview&interval=300000
```

Response:
```json
[
  { "timestamp": 1234560000, "value": 45 },
  { "timestamp": 1234620000, "value": 52 },
  { "timestamp": 1234680000, "value": 38 }
]
```

#### Get Funnel Analysis
```
GET /api/funnel?steps=pageview,click,conversion
```

Response:
```json
[
  { "step": "pageview", "count": 1000, "dropoff": 0 },
  { "step": "click", "count": 450, "dropoff": 55.0 },
  { "step": "conversion", "count": 89, "dropoff": 80.22 }
]
```

#### Get Anomalies
```
GET /api/anomalies
```

Response:
```json
[
  {
    "type": "statistical_anomaly",
    "severity": "high",
    "description": "Unusual totalEvents value detected",
    "timestamp": 1234567890,
    "metric": "totalEvents",
    "currentValue": 5000,
    "expectedValue": 1200,
    "deviation": 4.2
  }
]
```

#### Get Real-time Stats
```
GET /api/realtime
```

Response:
```json
{
  "activeSessions": 45,
  "activeUsers": 38,
  "eventsLastMinute": 67,
  "topActivePages": [
    { "page": "/", "count": 12 },
    { "page": "/products", "count": 8 },
    { "page": "/checkout", "count": 5 }
  ]
}
```

## JavaScript Tracking Library

```javascript
// Initialize tracker
const analytics = {
  sessionId: generateSessionId(),
  userId: null,

  track(type, properties = {}) {
    fetch('https://edge-analytics.example.com/collect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type,
        sessionId: this.sessionId,
        userId: this.userId,
        properties
      })
    });
  },

  pageview(page, title) {
    this.track('pageview', { page, title, referrer: document.referrer });
  },

  event(name, data) {
    this.track(name, data);
  },

  identify(userId) {
    this.userId = userId;
    this.track('identify', { userId });
  }
};

// Track page views
analytics.pageview(window.location.pathname, document.title);

// Track custom events
document.querySelectorAll('button').forEach(btn => {
  btn.addEventListener('click', () => {
    analytics.event('button_click', {
      buttonId: btn.id,
      buttonText: btn.textContent
    });
  });
});

// Identify user after login
analytics.identify('user_12345');
```

## Event Types

### Standard Events
- `pageview`: Page view tracking
- `click`: Click events
- `submit`: Form submissions
- `conversion`: Conversion events
- `error`: Error tracking
- `identify`: User identification
- `custom`: Custom events

### Event Properties
Common properties:
- `page`: Current page path
- `title`: Page title
- `referrer`: Referrer URL
- `duration`: Event duration
- `value`: Event value
- `category`: Event category
- Custom properties as needed

## Session Management

### Session Lifecycle
1. **Creation**: New session on first event
2. **Activity**: Updated on each event
3. **Timeout**: Expires after 30 minutes of inactivity
4. **Cleanup**: Removed from memory after timeout

### Session Properties
- `id`: Unique session identifier
- `userId`: Associated user (if identified)
- `startTime`: Session start timestamp
- `lastActivity`: Last event timestamp
- `duration`: Total session duration
- `pageViews`: Number of page views
- `events`: All events in session
- `landingPage`: First page visited
- `referrer`: Traffic source

## Anomaly Detection

### Detection Methods

#### Statistical Anomaly (Z-score)
Detects values that deviate significantly from historical mean:
- Threshold: 3 standard deviations
- Requires: Minimum 10 data points
- Severity: Based on deviation magnitude

#### Spike Detection
Detects sudden increases compared to recent average:
- Compares to last 5 data points
- Threshold: 2x recent average
- Ideal for traffic spikes

### Anomaly Response
```json
{
  "type": "spike_anomaly",
  "severity": "high",
  "description": "Spike in uniqueSessions detected",
  "timestamp": 1234567890,
  "metric": "uniqueSessions",
  "currentValue": 5000,
  "expectedValue": 1500,
  "deviation": 3.33
}
```

### Severity Levels
- **Low**: 3-4 standard deviations
- **Medium**: 4-5 standard deviations
- **High**: >5 standard deviations

## Device & Geo Detection

### Device Detection
Automatically detects from User-Agent:
- Device type: desktop, mobile, tablet, bot
- Operating system: Windows, macOS, iOS, Android, Linux
- Browser: Chrome, Firefox, Safari, Edge, Opera

### Geographic Detection
Uses request headers:
- Country: `CF-IPCountry` header
- Region: `CF-Region` header
- City: `CF-City` header (if available)
- Coordinates: Can be added via GeoIP database

## Performance Characteristics

- Event ingestion: O(1)
- Event retrieval: O(n) with filtering
- Session lookup: O(1)
- Metric aggregation: O(n) where n = event count
- Anomaly detection: O(m) where m = metric count
- Memory: ~100KB per 1000 events

## Configuration

### Event Storage
```typescript
maxEvents: 100000  // Maximum events in memory
```

### Session Timeout
```typescript
sessionTimeout: 30 * 60 * 1000  // 30 minutes
```

### Anomaly Detection
```typescript
detectionWindow: 60        // Data points for baseline
failureThreshold: 3        // Standard deviations
spikeThreshold: 2          // Multiplier for spike detection
```

## Architecture

### Data Flow
1. Event arrives via POST /collect
2. Device and geo enrichment
3. Event stored in collector
4. Session created/updated
5. Metrics aggregated in real-time
6. Anomaly detection runs periodically
7. Data served via Dashboard API

### Components
- **EventCollector**: Stores raw events
- **SessionTracker**: Manages user sessions
- **RealTimeAggregator**: Computes metrics
- **AnomalyDetector**: Identifies anomalies
- **RequestAnalyzer**: Enriches events with device/geo

### Background Jobs
- Session cleanup: Every 5 minutes
- Anomaly detection: Every 1 minute
- Metric aggregation: On-demand

## Usage Examples

### Track Page Views
```javascript
fetch('https://edge-analytics.example.com/collect', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    type: 'pageview',
    sessionId: 'sess_abc123',
    properties: {
      page: '/products',
      title: 'Products Page'
    }
  })
});
```

### Build Real-time Dashboard
```javascript
async function updateDashboard() {
  const realtime = await fetch('/api/realtime').then(r => r.json());
  const metrics = await fetch('/api/metrics').then(r => r.json());

  document.getElementById('active-users').textContent = realtime.activeUsers;
  document.getElementById('total-events').textContent = metrics.totalEvents;
  document.getElementById('bounce-rate').textContent = metrics.bounceRate + '%';
}

setInterval(updateDashboard, 5000); // Update every 5 seconds
```

### Funnel Analysis
```javascript
const funnel = await fetch('/api/funnel?steps=view_product,add_to_cart,checkout,purchase')
  .then(r => r.json());

console.log('Conversion Funnel:');
funnel.forEach(step => {
  console.log(`${step.step}: ${step.count} (${step.dropoff}% dropoff)`);
});
```

## Production Considerations

1. **Persistent Storage**: Use database (PostgreSQL, ClickHouse) for long-term storage
2. **Message Queue**: Kafka/Kinesis for high-volume event ingestion
3. **Time-series Database**: InfluxDB/TimescaleDB for metrics
4. **Distributed Cache**: Redis for session storage across regions
5. **Sampling**: Sample high-traffic events to reduce load
6. **Data Retention**: Implement TTL policies for old events
7. **Privacy**: Anonymize PII, respect Do Not Track
8. **GDPR Compliance**: Support data deletion requests
9. **Rate Limiting**: Prevent abuse of collection endpoint
10. **Authentication**: Secure dashboard API endpoints

## Monitoring & Alerts

### Key Metrics to Monitor
- Event ingestion rate
- API response times
- Active sessions count
- Storage utilization
- Anomaly detection accuracy
- Dashboard API latency

### Alert Conditions
- Event ingestion drops to 0
- Memory usage > 80%
- API errors > 1%
- Anomalies detected
- Session storage overflow

## Integration Examples

### Google Tag Manager
```javascript
dataLayer.push({
  event: 'custom_event',
  eventCallback: function() {
    fetch('https://edge-analytics.example.com/collect', {
      method: 'POST',
      body: JSON.stringify({
        type: 'gtm_event',
        sessionId: getSessionId(),
        properties: dataLayer
      })
    });
  }
});
```

### React Hook
```javascript
function useAnalytics() {
  const track = useCallback((type, properties) => {
    fetch('/collect', {
      method: 'POST',
      body: JSON.stringify({
        type,
        sessionId: sessionStorage.getItem('sessionId'),
        properties
      })
    });
  }, []);

  return { track };
}

// Usage
const { track } = useAnalytics();
track('button_click', { button: 'signup' });
```

## Privacy & Compliance

### Data Collection
- No PII collected by default
- IP addresses hashed
- User-Agent strings sanitized
- Respect DNT (Do Not Track) header

### GDPR Compliance
- Consent management support
- Data deletion API
- Data export functionality
- Privacy-friendly defaults

### Data Retention
- Events: 90 days default
- Sessions: 30 days
- Aggregated metrics: 1 year
- Anomaly logs: 6 months

## Testing

```bash
# Start the service
deno run --allow-net server.ts

# Track an event
curl -X POST http://localhost:8084/collect \
  -H "Content-Type: application/json" \
  -d '{
    "type": "pageview",
    "sessionId": "sess_test123",
    "properties": {"page": "/test"}
  }'

# Get metrics
curl http://localhost:8084/api/metrics

# Get real-time stats
curl http://localhost:8084/api/realtime

# Get time series
curl http://localhost:8084/api/timeseries?metric=events&interval=60000

# Funnel analysis
curl http://localhost:8084/api/funnel?steps=pageview,click,conversion
```

## Edge Platform Deployment

This service is optimized for edge deployment on:
- Cloudflare Workers + Durable Objects
- Fastly Compute@Edge + KV Store
- AWS Lambda@Edge + DynamoDB
- Deno Deploy + PostgreSQL

Adapt storage layer based on platform capabilities.
