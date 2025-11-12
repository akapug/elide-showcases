# Production API Gateway

A production-grade API Gateway implementation showcasing enterprise patterns with Elide. This gateway demonstrates a complete suite of features required for modern API management in real-world applications.

## Features Overview

### Authentication & Authorization
- **JWT Authentication** with access and refresh tokens
- **OAuth2 Integration** (Google, GitHub, Microsoft)
- **API Key Management** with permissions and expiration
- **Multi-Strategy Auth** supporting different auth methods per route

### Rate Limiting
- **Multi-Tier Rate Limiting** (per user, per IP, per endpoint)
- **Multiple Algorithms** (token bucket, leaky bucket, sliding window, fixed window)
- **Burst Support** for handling traffic spikes
- **Dynamic Configuration** per endpoint and user tier

### Request/Response Handling
- **Advanced Transformation** (field mapping, validation, sanitization)
- **Content Negotiation** (JSON, XML, CSV)
- **Input Validation** with comprehensive rules
- **Response Wrapping** with metadata enrichment

### Gateway Features
- **GraphQL Gateway** with query complexity analysis and caching
- **WebSocket Proxying** with room/channel management
- **Load Balancing** (round-robin, least connections, weighted, IP hash)
- **Health Checking** with automatic failover
- **Circuit Breaker** pattern for fault tolerance

### Caching & Performance
- **Multi-Tier Caching** (L1: memory, L2: Redis-like)
- **Cache Invalidation** (by key, prefix, tag, regex)
- **ETag Support** for conditional requests
- **Cache Warming** capabilities

### Monitoring & Operations
- **Real-Time Analytics** with request metrics
- **Performance Tracking** (P50, P95, P99 latency)
- **Error Tracking** with detailed logging
- **Alert System** with configurable rules
- **Request Logging** with correlation IDs

### API Management
- **API Versioning** (v1, v2, etc.)
- **CORS Management** with flexible policies
- **Request Correlation** with unique IDs

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     API Gateway                              │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │     CORS     │  │     Auth     │  │ Rate Limit   │      │
│  │   Manager    │  │   Service    │  │    Multi     │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Transformer  │  │    Cache     │  │Load Balancer │      │
│  │   Pipeline   │  │   Manager    │  │   + Health   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   GraphQL    │  │  WebSocket   │  │  Analytics   │      │
│  │   Gateway    │  │    Proxy     │  │   Service    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                               │
└─────────────────────────────────────────────────────────────┘
                           │
                ┌──────────┴──────────┐
                │                     │
        ┌───────▼────────┐    ┌──────▼───────┐
        │  Backend 1     │    │  Backend 2   │
        │  :4001         │    │  :4002       │
        └────────────────┘    └──────────────┘
```

## Quick Start

### Start the Gateway

```bash
elide serve server.ts
```

The gateway will start on `http://localhost:3000`.

### Explore the API

```bash
# Get gateway info
curl http://localhost:3000

# Health check
curl http://localhost:3000/health
```

## Authentication

### JWT Authentication

#### 1. Login and Get Tokens

```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "secure-password"
  }'
```

Response:
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 900,
  "user": {
    "id": "user-123",
    "email": "user@example.com",
    "role": "user"
  }
}
```

#### 2. Use Access Token

```bash
TOKEN="your-access-token"

curl http://localhost:3000/api/v1/users \
  -H "Authorization: Bearer $TOKEN"
```

#### 3. Refresh Access Token

```bash
curl -X POST http://localhost:3000/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "your-refresh-token"
  }'
```

### API Key Authentication

#### Generate API Key

```bash
curl -X POST http://localhost:3000/auth/apikey/generate \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Production API Key",
    "permissions": ["read", "write"],
    "expiresInDays": 90
  }'
```

Response:
```json
{
  "apiKey": "sk_a1b2c3d4e5f6...",
  "name": "Production API Key",
  "permissions": ["read", "write"],
  "expiresAt": 1704067200000
}
```

#### Use API Key

```bash
API_KEY="sk_a1b2c3d4e5f6..."

curl http://localhost:3000/api/v2/users \
  -H "Authorization: ApiKey $API_KEY"
```

### OAuth2 Authentication

#### Get Authorization URL

```bash
curl http://localhost:3000/auth/oauth2/google
```

Response:
```json
{
  "authUrl": "https://accounts.google.com/o/oauth2/v2/auth?client_id=...",
  "state": "unique-state-value"
}
```

## API Routes

### REST API (v1)

#### GET /api/v1/users
Get list of users (requires JWT authentication).

```bash
curl http://localhost:3000/api/v1/users \
  -H "Authorization: Bearer $TOKEN"
```

**Features:**
- JWT authentication required
- Rate limit: 100 requests/minute per user
- Cached for 30 seconds
- Response transformation enabled

#### GET /api/v1/products
Get product catalog (public endpoint).

```bash
curl http://localhost:3000/api/v1/products
```

**Features:**
- No authentication required
- Rate limit: 1000 requests/minute per IP
- Cached for 5 minutes
- Load balanced across backends

#### POST /api/v1/orders
Create a new order (requires JWT authentication).

```bash
curl -X POST http://localhost:3000/api/v1/orders \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "productId": "prod-123",
    "quantity": 2
  }'
```

**Features:**
- JWT authentication required
- Rate limit: 50 requests/minute per user (token bucket with burst=10)
- Input validation (productId: required string, quantity: 1-100)
- Request/response transformation

### REST API (v2)

#### GET /api/v2/users
Get users list with enhanced features (requires API key).

```bash
curl http://localhost:3000/api/v2/users \
  -H "Authorization: ApiKey $API_KEY"
```

**Features:**
- API key authentication
- Rate limit: 200 requests/minute per user
- Cached for 60 seconds
- Enhanced response format

## GraphQL Gateway

The gateway provides a built-in GraphQL endpoint with query complexity analysis and caching.

### Example Query

```bash
curl -X POST http://localhost:3000/graphql \
  -H "Content-Type: application/json" \
  -d '{
    "query": "{ users { id name email } }"
  }'
```

### Query with Variables

```bash
curl -X POST http://localhost:3000/graphql \
  -H "Content-Type: application/json" \
  -d '{
    "query": "query GetUser($id: String!) { user(id: $id) { id name email } }",
    "variables": { "id": "123" }
  }'
```

### Mutation Example

```bash
curl -X POST http://localhost:3000/graphql \
  -H "Content-Type: application/json" \
  -d '{
    "query": "mutation CreateUser($name: String!, $email: String!) { createUser(name: $name, email: $email) { id name email } }",
    "variables": {
      "name": "John Doe",
      "email": "john@example.com"
    }
  }'
```

### Batch Queries

```bash
curl -X POST http://localhost:3000/graphql \
  -H "Content-Type: application/json" \
  -d '[
    { "query": "{ users { id name } }" },
    { "query": "{ products { id name price } }" }
  ]'
```

**Features:**
- Query complexity analysis (max: 1000)
- Max depth limit: 10
- Query caching (60 seconds)
- Batch query support
- Error handling with extensions

## Admin Endpoints

### Analytics Dashboard

```bash
curl http://localhost:3000/admin/analytics
```

Response:
```json
{
  "timestamp": 1704067200000,
  "totalRequests": 15234,
  "totalErrors": 45,
  "avgResponseTime": 125.6,
  "requestsPerSecond": 42.5,
  "errorRate": 0.003,
  "topEndpoints": [
    { "endpoint": "GET /api/v1/products", "count": 5432 },
    { "endpoint": "GET /api/v1/users", "count": 3210 }
  ],
  "topErrors": [
    { "error": "Rate limit exceeded", "count": 23 },
    { "error": "Invalid token", "count": 12 }
  ]
}
```

### Performance Metrics

```bash
curl http://localhost:3000/admin/metrics
```

Response:
```json
{
  "endpoint": "ALL",
  "method": "ALL",
  "avgResponseTime": 125.6,
  "minResponseTime": 12,
  "maxResponseTime": 1523,
  "p50": 98,
  "p95": 456,
  "p99": 892,
  "requestCount": 15234,
  "errorCount": 45,
  "errorRate": 0.00295
}
```

### Active Alerts

```bash
curl http://localhost:3000/admin/alerts
```

### Error Logs

```bash
# Get all error logs
curl http://localhost:3000/admin/logs?level=error&limit=50

# Get warning logs
curl http://localhost:3000/admin/logs?level=warn
```

### Cache Statistics

```bash
curl http://localhost:3000/admin/cache/stats
```

Response:
```json
{
  "totalEntries": 156,
  "totalSize": 524288,
  "hits": 8456,
  "misses": 1234,
  "hitRate": 0.873,
  "evictions": 23,
  "l1Entries": 100,
  "l2Entries": 56
}
```

### Cache Invalidation

```bash
# Invalidate by key
curl -X POST http://localhost:3000/admin/cache/invalidate \
  -H "Content-Type: application/json" \
  -d '{ "type": "key", "value": "/api/v1/users:" }'

# Invalidate by prefix
curl -X POST http://localhost:3000/admin/cache/invalidate \
  -H "Content-Type: application/json" \
  -d '{ "type": "prefix", "value": "/api/v1/" }'

# Invalidate by tag
curl -X POST http://localhost:3000/admin/cache/invalidate \
  -H "Content-Type: application/json" \
  -d '{ "type": "tag", "value": "users" }'

# Invalidate by regex
curl -X POST http://localhost:3000/admin/cache/invalidate \
  -H "Content-Type": "application/json" \
  -d '{ "type": "regex", "value": "/api/v1/.*" }'
```

### Backend Status

```bash
curl http://localhost:3000/admin/backends
```

Response:
```json
[
  {
    "id": "backend-1",
    "url": "http://localhost:4001",
    "healthy": true,
    "circuitState": "closed",
    "activeConnections": 5,
    "totalRequests": 7850,
    "totalErrors": 12,
    "errorRate": 0.0015,
    "avgResponseTime": 98.5
  },
  {
    "id": "backend-2",
    "url": "http://localhost:4002",
    "healthy": true,
    "circuitState": "closed",
    "activeConnections": 3,
    "totalRequests": 7384,
    "totalErrors": 8,
    "errorRate": 0.0011,
    "avgResponseTime": 102.3
  }
]
```

### Routes Configuration

```bash
curl http://localhost:3000/admin/routes
```

## Rate Limiting

The gateway implements sophisticated rate limiting with multiple strategies:

### Rate Limit Algorithms

1. **Token Bucket** - Allows bursts while maintaining average rate
2. **Leaky Bucket** - Smooths traffic by processing at constant rate
3. **Sliding Window** - Prevents boundary issues with fixed windows
4. **Fixed Window** - Simple counter per time window

### Rate Limit Tiers

- **Per User** - Authenticated users tracked by user ID
- **Per IP** - Anonymous users tracked by IP address
- **Per Endpoint** - Specific limits for sensitive endpoints

### Rate Limit Headers

Every response includes rate limit information:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
Retry-After: 60
```

### Example: Rate Limit Exceeded

```bash
curl -i http://localhost:3000/api/v1/orders \
  -H "Authorization: Bearer $TOKEN"
```

Response:
```
HTTP/1.1 429 Too Many Requests
X-RateLimit-Limit: 50
X-RateLimit-Remaining: 0
Retry-After: 42

{
  "error": "Rate limit exceeded",
  "limitedBy": "user"
}
```

## Caching

### Multi-Tier Cache

- **L1 Cache** - In-memory LRU cache (1000 entries max)
- **L2 Cache** - Redis-like persistent cache with 2x TTL

### Cache Behavior

```bash
# First request - Cache MISS
curl -i http://localhost:3000/api/v1/products
# X-Cache: MISS

# Second request - Cache HIT
curl -i http://localhost:3000/api/v1/products
# X-Cache: HIT
```

### Conditional Requests (ETags)

```bash
# Get resource with ETag
curl -i http://localhost:3000/api/v1/products
# ETag: "a1b2c3d4"

# Conditional request
curl -i http://localhost:3000/api/v1/products \
  -H 'If-None-Match: "a1b2c3d4"'
# HTTP/1.1 304 Not Modified
```

### Cache Tags

Resources can be tagged for bulk invalidation:

```typescript
// Products cached with 'products' tag
cache.set(key, data, { ttl: 300000, tags: ['products'] });

// Invalidate all products
cache.invalidate({ type: 'tag', value: 'products' });
```

## Load Balancing

### Algorithms

- **Round Robin** - Distributes requests evenly
- **Least Connections** - Routes to server with fewest active connections
- **Weighted Round Robin** - Distributes based on server weights
- **IP Hash** - Consistent routing based on client IP
- **Random** - Random distribution

### Health Checking

Backends are automatically monitored:

```typescript
{
  interval: 10000,           // Check every 10 seconds
  timeout: 5000,             // 5 second timeout
  healthyThreshold: 2,       // 2 successful checks to mark healthy
  unhealthyThreshold: 3,     // 3 failed checks to mark unhealthy
  path: '/health'            // Health check endpoint
}
```

### Circuit Breaker

Protects against cascading failures:

- **Closed** - Normal operation
- **Open** - Too many failures, reject requests
- **Half-Open** - Testing if service recovered

Configuration:
```typescript
{
  failureThreshold: 5,       // Open after 5 failures
  resetTimeout: 60000,       // Try again after 60 seconds
  halfOpenMaxRequests: 3     // Test with 3 requests in half-open
}
```

## Request/Response Transformation

### Input Validation

```typescript
// Configure validation rules
transformer.setValidationRules('/api/v1/orders', [
  { field: 'productId', type: 'string', required: true },
  { field: 'quantity', type: 'number', required: true, min: 1, max: 100 },
  { field: 'email', type: 'email' }
]);
```

### Field Mapping

```typescript
// Map external field names to internal format
{
  fieldMapping: {
    'userId': 'user_id',
    'productId': 'product_id'
  }
}
```

### Response Wrapping

```typescript
// Wrap responses with metadata
{
  wrap: true,
  addMetadata: {
    version: 'v1',
    requestId: 'req-123',
    processedAt: '2024-01-01T12:00:00Z'
  }
}
```

### Content Negotiation

Supports multiple output formats:

```bash
# JSON (default)
curl http://localhost:3000/api/v1/users \
  -H "Accept: application/json"

# XML
curl http://localhost:3000/api/v1/users \
  -H "Accept: application/xml"

# CSV
curl http://localhost:3000/api/v1/users \
  -H "Accept: text/csv"
```

## CORS Management

### Global CORS

```typescript
// Apply to all routes
const cors = new CORSManager(
  CORSPresets.api(['https://example.com', 'https://app.example.com'])
);
```

### Route-Specific CORS

```typescript
// Different CORS for specific routes
corsManager.addPolicy({
  path: '/api/v1/public/*',
  config: CORSPresets.allowAll()
});

corsManager.addPolicy({
  path: '/graphql',
  config: CORSPresets.graphql(['https://studio.apollographql.com'])
});
```

### CORS Presets

- `allowAll()` - Allow all origins (development only)
- `strict(origins)` - Strict production settings
- `api(origins)` - API-specific CORS
- `readOnly(origins)` - Read-only endpoints
- `graphql(origins)` - GraphQL-specific
- `websocket(origins)` - WebSocket CORS

## WebSocket Proxying

### Connect to WebSocket

```javascript
const ws = new WebSocket('ws://localhost:3000/ws/chat');

ws.onopen = () => {
  // Join a room
  ws.send(JSON.stringify({
    type: 'join',
    room: 'general'
  }));
};

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  console.log('Received:', message);
};
```

### Send Messages

```javascript
// Send to room
ws.send(JSON.stringify({
  type: 'broadcast',
  room: 'general',
  data: { text: 'Hello everyone!' }
}));

// Broadcast to all
ws.send(JSON.stringify({
  type: 'broadcast',
  data: { text: 'Global announcement' }
}));
```

### Room Management

```javascript
// Leave room
ws.send(JSON.stringify({
  type: 'leave',
  room: 'general'
}));
```

## Monitoring & Analytics

### Request Correlation

Every request gets a unique ID:

```
X-Request-ID: 550e8400-e29b-41d4-a716-446655440000
```

Use this ID to track requests across logs and metrics.

### Performance Metrics

- **Average Response Time** - Mean request duration
- **P50, P95, P99** - Latency percentiles
- **Request Count** - Total requests handled
- **Error Rate** - Percentage of failed requests
- **Requests per Second** - Current throughput

### Alert Rules

Default alerts include:

1. **High Error Rate** - > 10% errors
2. **Slow Response** - Avg > 1 second
3. **Very Slow Response** - P95 > 3 seconds

Custom alerts:

```typescript
alertManager.addRule({
  id: 'custom-alert',
  type: 'custom',
  severity: 'high',
  message: 'Custom condition triggered',
  cooldownMs: 300000,
  condition: (metrics) => metrics.errorRate > 0.05
});
```

## Production Deployment

### Environment Variables

```bash
# JWT Secrets
export JWT_ACCESS_SECRET="your-secure-secret-key"
export JWT_REFRESH_SECRET="your-secure-refresh-secret"

# OAuth2 Configuration
export OAUTH2_GOOGLE_CLIENT_ID="your-client-id"
export OAUTH2_GOOGLE_CLIENT_SECRET="your-client-secret"

# Backend URLs
export BACKEND_1_URL="https://backend1.example.com"
export BACKEND_2_URL="https://backend2.example.com"

# CORS Origins
export CORS_ALLOWED_ORIGINS="https://example.com,https://app.example.com"
```

### Security Checklist

- [ ] Change JWT secrets from defaults
- [ ] Configure OAuth2 client credentials
- [ ] Set up proper CORS origins
- [ ] Enable HTTPS in production
- [ ] Configure rate limits for your use case
- [ ] Set up proper logging and monitoring
- [ ] Review and adjust cache TTLs
- [ ] Configure backend health check endpoints
- [ ] Set up alerts for critical metrics
- [ ] Review API key permissions

### Performance Tuning

```typescript
// Adjust cache size for your workload
const cache = new CacheManager({
  maxSize: 10000,           // Increase for high-traffic sites
  defaultTTL: 300000,       // 5 minutes
  evictionPolicy: 'lru'
});

// Configure rate limits per tier
rateLimiter.setEndpointLimit('/api/premium/users', 'GET', {
  algorithm: 'token-bucket',
  maxRequests: 1000,        // Higher limit for premium users
  windowMs: 60000,
  burstSize: 200
});

// Adjust load balancer retry strategy
const loadBalancer = new LoadBalancer({
  algorithm: 'least-connections',
  retries: 5,               // More retries for critical operations
  retryDelay: 200
});
```

## Example Workflows

### Complete Authentication Flow

```bash
# 1. Login
TOKEN_RESPONSE=$(curl -s -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"pass123"}')

ACCESS_TOKEN=$(echo $TOKEN_RESPONSE | jq -r '.accessToken')
REFRESH_TOKEN=$(echo $TOKEN_RESPONSE | jq -r '.refreshToken')

# 2. Make authenticated requests
curl http://localhost:3000/api/v1/users \
  -H "Authorization: Bearer $ACCESS_TOKEN"

# 3. When access token expires, refresh it
NEW_TOKEN_RESPONSE=$(curl -s -X POST http://localhost:3000/auth/refresh \
  -H "Content-Type: application/json" \
  -d "{\"refreshToken\":\"$REFRESH_TOKEN\"}")

NEW_ACCESS_TOKEN=$(echo $NEW_TOKEN_RESPONSE | jq -r '.accessToken')

# 4. Continue with new access token
curl http://localhost:3000/api/v1/users \
  -H "Authorization: Bearer $NEW_ACCESS_TOKEN"
```

### API Key Workflow

```bash
# 1. Generate API key
API_KEY_RESPONSE=$(curl -s -X POST http://localhost:3000/auth/apikey/generate \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Production Key",
    "permissions": ["read", "write"],
    "expiresInDays": 90
  }')

API_KEY=$(echo $API_KEY_RESPONSE | jq -r '.apiKey')

# 2. Use API key for requests
curl http://localhost:3000/api/v2/users \
  -H "Authorization: ApiKey $API_KEY"
```

### Monitoring Workflow

```bash
# 1. Check health
curl http://localhost:3000/health

# 2. View metrics
curl http://localhost:3000/admin/metrics

# 3. Check for alerts
curl http://localhost:3000/admin/alerts

# 4. View error logs
curl "http://localhost:3000/admin/logs?level=error&limit=10"

# 5. Check backend status
curl http://localhost:3000/admin/backends
```

## Module Documentation

### Core Modules

- **auth-strategies.ts** - JWT, OAuth2, API key management
- **rate-limiter.ts** - Multi-tier rate limiting with multiple algorithms
- **transformer.ts** - Request/response transformation and validation
- **graphql-gateway.ts** - GraphQL proxy with caching
- **websocket-proxy.ts** - WebSocket connection management
- **analytics.ts** - Metrics, logging, and alerting
- **load-balancer.ts** - Load balancing with health checks
- **cache-manager.ts** - Multi-tier caching system
- **cors-manager.ts** - CORS policy management

## Why Elide?

This showcase demonstrates Elide's capabilities for production API gateways:

- **High Performance** - Minimal latency overhead
- **Type Safety** - TypeScript throughout for reliability
- **Standards-Based** - Web standard APIs (Request, Response, Headers)
- **Lightweight** - No heavy framework dependencies
- **Production Ready** - Battle-tested patterns
- **Easy Deployment** - Single binary with no dependencies
- **Native HTTP** - Built-in HTTP server support
- **Developer Experience** - Fast iteration and hot reload

## License

MIT

## Contributing

Contributions welcome! This is a showcase project demonstrating production patterns with Elide.
