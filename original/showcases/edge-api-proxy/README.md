# Edge API Proxy

A production-grade API gateway running at the edge, providing intelligent request routing, response transformation, automatic failover, load balancing, and API composition capabilities.

## Features

### Request Routing
- Path-based routing
- Method-based routing
- Multiple backend support
- Route prioritization
- Pattern matching

### Load Balancing
- Multiple strategies: round-robin, least-connections, weighted
- Automatic backend selection
- Connection tracking
- Latency-aware routing
- Health-based distribution

### Failover & Resilience
- Automatic failover to healthy backends
- Circuit breaker pattern
- Retry logic with exponential backoff
- Health checking
- Graceful degradation

### Response Transformation
- Header manipulation (request & response)
- Body transformation
- JSON restructuring
- Legacy API adaptation
- Format conversion

### API Composition
- Parallel request execution
- Multiple API aggregation
- Response merging
- Error isolation
- Timeout handling

### Caching
- Response caching with TTL
- Vary-by headers support
- Cache key customization
- Selective caching by status code
- Cache invalidation

## API Endpoints

### Proxied Routes

#### Users API
```
GET /api/users
Authorization: Bearer <token>
```
- Backends: api-1, api-2, api-3
- Cache: 60 seconds
- Transformed headers

#### Legacy API
```
GET /api/legacy
```
- Backend: legacy server
- Response transformation applied
- Wrapped in metadata envelope

#### Products API
```
GET /api/products
```
- Backends: api-1, api-2
- Cache: 5 minutes
- Rate limited: 100 req/min

### Admin Endpoints

#### Proxy Statistics
```
GET /_proxy/stats
```

Response:
```json
{
  "backends": {
    "api-1": {
      "healthy": true,
      "latency": 45,
      "activeConnections": 3,
      "failureCount": 0
    },
    "api-2": {
      "healthy": true,
      "latency": 52,
      "activeConnections": 1,
      "failureCount": 0
    }
  },
  "cache": {
    "entries": 42,
    "keys": ["/api/users", "/api/products"]
  }
}
```

#### Clear Cache
```
GET /_proxy/cache/clear
```

Response:
```json
{
  "message": "Cache cleared"
}
```

#### API Composition
```
POST /_proxy/compose
Content-Type: application/json

{
  "requests": [
    {
      "name": "user",
      "url": "https://api.example.com/users/123"
    },
    {
      "name": "posts",
      "url": "https://api.example.com/users/123/posts"
    },
    {
      "name": "comments",
      "url": "https://api.example.com/users/123/comments"
    }
  ]
}
```

Response:
```json
{
  "composed": true,
  "results": {
    "user": {
      "success": true,
      "data": { "id": 123, "name": "John Doe" }
    },
    "posts": {
      "success": true,
      "data": [{ "id": 1, "title": "First Post" }]
    },
    "comments": {
      "success": true,
      "data": [{ "id": 1, "text": "Great!" }]
    }
  }
}
```

## Response Headers

All proxied responses include:

```
X-Backend: api-1
X-Backend-Latency: 45ms
X-Cache: HIT|MISS
X-Proxy: edge
```

## Load Balancing Strategies

### Weighted Distribution
Backends are selected based on configured weights:
- api-1: weight 3 (60% of traffic)
- api-2: weight 2 (40% of traffic)
- api-3: weight 1 (20% of traffic)

### Least Connections
Selects backend with fewest active connections, ideal for long-running requests.

### Round Robin
Distributes requests evenly across all healthy backends.

## Circuit Breaker

The circuit breaker protects backends from overload:

### States
1. **Closed**: Normal operation, requests flow through
2. **Open**: Backend unhealthy, requests fail fast
3. **Half-Open**: Testing if backend recovered

### Configuration
- Failure threshold: 5 consecutive failures
- Recovery timeout: 30 seconds
- Half-open max requests: 3

### Behavior
- After 5 failures, circuit opens
- Requests fail immediately for 30 seconds
- After timeout, allows 3 test requests
- If successful, circuit closes
- If failures continue, circuit reopens

## Route Configuration

### Define Routes
```typescript
{
  path: "/api/users",
  backends: ["api-1", "api-2", "api-3"],
  cache: {
    ttl: 60000,
    varyBy: ["Authorization"]
  },
  transform: {
    requestHeaders: {
      "X-API-Version": "v2"
    },
    responseHeaders: {
      "X-Proxy": "edge"
    }
  }
}
```

### Request Transformation
```typescript
transform: {
  requestHeaders: {
    "X-Client-Id": "edge-proxy",
    "X-Request-Id": "<generated-uuid>"
  }
}
```

### Response Transformation
```typescript
transform: {
  responseBody: (body) => ({
    data: body,
    meta: {
      source: "legacy",
      transformedAt: new Date().toISOString()
    }
  })
}
```

## Caching Strategy

### Cache Keys
Generated from:
- HTTP method
- Path
- Vary-by headers (e.g., Authorization)

Example: `GET:/api/users:Authorization=Bearer xyz123`

### Vary-By Headers
```typescript
cache: {
  ttl: 60000,
  varyBy: ["Authorization", "Accept-Language"]
}
```

### Selective Caching
```typescript
cache: {
  ttl: 300000,
  cacheableStatus: [200, 304]
}
```

## Architecture

### Request Flow
1. Request arrives at edge proxy
2. Route matching
3. Cache lookup (if configured)
4. Backend selection via load balancer
5. Circuit breaker check
6. Request transformation
7. Forward to backend
8. Response transformation
9. Cache storage
10. Return to client

### Failover Flow
1. Primary backend selected
2. Request fails
3. Record failure
4. Update circuit breaker
5. Select next healthy backend
6. Retry request
7. Max 3 attempts
8. Return 503 if all fail

### Health Tracking
- Latency measurement per request
- Failure count tracking
- Active connection monitoring
- Automatic health status updates
- Unhealthy after 3 consecutive failures

## Usage Examples

### Basic Proxying
```bash
# Request routed to healthy backend
curl http://localhost:8083/api/users
```

### With Caching
```bash
# First request - cache MISS
curl http://localhost:8083/api/users

# Second request - cache HIT
curl http://localhost:8083/api/users
```

### Legacy API Transformation
```bash
# Request to legacy API with response transformation
curl http://localhost:8083/api/legacy

# Response includes wrapper:
{
  "data": { "original": "response" },
  "meta": {
    "source": "legacy",
    "transformedAt": "2024-01-01T12:00:00.000Z"
  }
}
```

### API Composition
```bash
# Compose multiple API calls
curl -X POST http://localhost:8083/_proxy/compose \
  -H "Content-Type: application/json" \
  -d '{
    "requests": [
      {"name": "user", "url": "https://api.example.com/users/1"},
      {"name": "posts", "url": "https://api.example.com/users/1/posts"}
    ]
  }'
```

### Check Backend Health
```bash
# View backend statistics
curl http://localhost:8083/_proxy/stats
```

## Performance Characteristics

- Backend selection: O(n) where n = number of backends (typically < 10)
- Cache lookup: O(1)
- Route matching: O(m) where m = number of routes
- Request forwarding: O(1)
- Failover attempts: Max 3 retries

## Configuration

### Backend Definition
```typescript
{
  id: "api-1",
  url: "https://api1.example.com",
  weight: 3,
  healthy: true,
  latency: 0,
  activeConnections: 0,
  lastHealthCheck: Date.now(),
  failureCount: 0
}
```

### Circuit Breaker Settings
```typescript
failureThreshold: 5
recoveryTimeout: 30000  // 30 seconds
halfOpenMaxRequests: 3
```

### Cache Settings
```typescript
ttl: 60000              // 60 seconds
varyBy: ["Authorization"]
cacheableStatus: [200, 304]
```

## Production Considerations

1. **Distributed Cache**: Use Redis for multi-region cache consistency
2. **Health Checks**: Implement active health checking (periodic pings)
3. **Metrics**: Export Prometheus metrics for monitoring
4. **Logging**: Structured logging for request tracing
5. **Rate Limiting**: Per-client rate limiting
6. **Authentication**: API key validation
7. **TLS**: Enforce HTTPS for backend communication
8. **Timeouts**: Configure request/response timeouts
9. **Retry Strategy**: Exponential backoff with jitter
10. **Connection Pooling**: Reuse connections to backends

## Monitoring

### Key Metrics
- Request rate per backend
- Error rate per backend
- Latency percentiles (p50, p95, p99)
- Cache hit rate
- Circuit breaker state changes
- Active connections
- Backend health status

### Alerts
- Backend unhealthy (3+ failures)
- Circuit breaker open
- Cache hit rate < 50%
- Average latency > 1s
- Error rate > 1%

## Security

### Headers to Add
```typescript
requestHeaders: {
  "X-Forwarded-For": clientIP,
  "X-Forwarded-Proto": "https",
  "X-Request-ID": uuid()
}
```

### Headers to Strip
```typescript
// Remove sensitive headers before forwarding
delete headers["X-Internal-Token"]
delete headers["X-Admin-Key"]
```

### Rate Limiting
```typescript
rateLimit: {
  requestsPerMinute: 100,
  burstSize: 20
}
```

## Edge Platform Deployment

### Cloudflare Workers
```javascript
export default {
  async fetch(request, env) {
    return proxy.handleRequest(request);
  }
}
```

### Fastly Compute@Edge
```rust
#[fastly::main]
fn main(req: Request) -> Result<Response, Error> {
    proxy_request(req)
}
```

### AWS Lambda@Edge
```javascript
exports.handler = async (event) => {
  const request = event.Records[0].cf.request;
  return proxyRequest(request);
};
```

## Testing

```bash
# Start the proxy
deno run --allow-net server.ts

# Test basic routing
curl -i http://localhost:8083/api/users

# Test failover (simulate backend failure)
# Backend will automatically failover to healthy instance

# Test caching
curl http://localhost:8083/api/products
curl http://localhost:8083/api/products  # Should be cached

# Test API composition
curl -X POST http://localhost:8083/_proxy/compose \
  -H "Content-Type: application/json" \
  -d '{"requests": [{"name": "test", "url": "https://api.example.com/test"}]}'

# Check stats
curl http://localhost:8083/_proxy/stats
```

## Advanced Features

### Request Coalescing
Multiple concurrent requests to same resource result in single backend call.

### Stale-While-Revalidate
Serve cached content while fetching fresh data in background.

### Conditional Requests
Support for ETags and If-None-Match headers.

### Compression
Automatic gzip/brotli compression for responses.

### WebSocket Proxying
Upgrade connections for WebSocket support.
