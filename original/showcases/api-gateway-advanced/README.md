# Advanced API Gateway

A production-ready API Gateway implementation showcasing enterprise patterns with Elide.

## Features

- **Rate Limiting**: Sliding window rate limiting per client or IP address
- **JWT Authentication**: Token-based authentication with validation
- **Request/Response Transformation**: Modify data in-flight
- **Multi-layer Caching**: Intelligent caching with ETag support
- **API Versioning**: Route requests to different API versions
- **Request Enrichment**: Add metadata and context to requests

## Architecture

The API Gateway acts as a single entry point for all client requests, providing:

1. **Security Layer**: Authentication and authorization
2. **Traffic Control**: Rate limiting and throttling
3. **Performance**: Response caching and optimization
4. **Flexibility**: Request/response transformation
5. **Versioning**: Support for multiple API versions

## API Endpoints

### Authentication

#### POST /auth/login
Generate a JWT token for authentication.

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
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 3600
}
```

### API Routes (via Gateway)

#### GET /api/v1/users
Get users list (requires authentication, cached for 30s).

```bash
curl http://localhost:3000/api/v1/users \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Response Headers:
```
X-RateLimit-Remaining: 99
X-Cache: HIT
X-API-Version: v1
ETag: "abc123"
```

#### GET /api/v2/users
Get users list from v2 API (higher rate limit, cached for 60s).

```bash
curl http://localhost:3000/api/v2/users \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### GET /api/v1/products
Get products list (no auth required, public endpoint).

```bash
curl http://localhost:3000/api/v1/products
```

#### POST /api/v1/orders
Create an order (requires authentication, input sanitization).

```bash
curl -X POST http://localhost:3000/api/v1/orders \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "productId": "prod-123",
    "quantity": 2,
    "userId": "user-456"
  }'
```

### Admin Endpoints

#### GET /admin/cache/stats
View cache statistics and entries.

```bash
curl http://localhost:3000/admin/cache/stats
```

Response:
```json
{
  "totalEntries": 5,
  "entries": [
    {
      "key": "/api/v1/users:",
      "age": "15s",
      "ttl": "30s",
      "etag": "\"1a2b3c\""
    }
  ]
}
```

#### POST /admin/cache/invalidate
Invalidate cache entries by pattern.

```bash
curl -X POST http://localhost:3000/admin/cache/invalidate \
  -H "Content-Type: application/json" \
  -d '{ "pattern": "/api/v1/users.*" }'
```

#### GET /admin/routes
List all configured routes.

```bash
curl http://localhost:3000/admin/routes
```

### GET /health
Health check endpoint.

```bash
curl http://localhost:3000/health
```

## Rate Limiting

The gateway implements sliding window rate limiting with configurable limits per route:

- **Client-based**: Tracks authenticated users by JWT subject
- **IP-based**: Tracks requests by client IP address
- **Per-route limits**: Different limits for different endpoints

### Rate Limit Headers

Every response includes rate limit information:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 2024-01-01T12:00:00.000Z
```

### Example Rate Limits

- `/api/v1/users`: 100 requests/minute per client
- `/api/v2/users`: 200 requests/minute per client (premium)
- `/api/v1/products`: 500 requests/minute per IP (public)
- `/api/v1/orders`: 50 requests/minute per client (write operations)

## Caching Strategy

### Cache Levels

1. **Response Cache**: Full response caching for GET requests
2. **ETag Support**: Conditional requests with If-None-Match
3. **Cache Headers**: Age and cache status in responses

### Cache Behavior

```bash
# First request - Cache MISS
curl -i http://localhost:3000/api/v1/products
# X-Cache: MISS

# Second request - Cache HIT
curl -i http://localhost:3000/api/v1/products
# X-Cache: HIT
# Age: 5

# Conditional request with ETag
curl -i http://localhost:3000/api/v1/products \
  -H 'If-None-Match: "abc123"'
# HTTP/1.1 304 Not Modified
```

## Request/Response Transformation

### Request Transformation

- **Input Sanitization**: Remove dangerous fields
- **Data Enrichment**: Add timestamps and metadata
- **Format Conversion**: Transform data structures

### Response Transformation

- **Metadata Addition**: Add version and processing info
- **Field Filtering**: Remove sensitive data
- **Structure Wrapping**: Wrap responses in standard envelope

### Example Transformation

Request:
```json
{
  "productId": "prod-123",
  "quantity": 2
}
```

Transformed Request:
```json
{
  "productId": "prod-123",
  "quantity": 2,
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

Response (enriched):
```json
{
  "data": {
    "orderId": "order-789",
    "status": "created"
  },
  "metadata": {
    "version": "v1",
    "processedAt": "2024-01-01T12:00:00.123Z"
  }
}
```

## API Versioning

The gateway supports multiple API versions simultaneously:

- **v1 API**: Legacy endpoints with standard limits
- **v2 API**: Enhanced endpoints with higher limits
- **Version Header**: `X-API-Version` in responses

### Version Migration

```bash
# Old clients use v1
curl http://localhost:3000/api/v1/users

# New clients use v2
curl http://localhost:3000/api/v2/users
```

## JWT Authentication

### Token Structure

```json
{
  "sub": "user-id",
  "email": "user@example.com",
  "role": "user",
  "iat": 1234567890,
  "exp": 1234571490
}
```

### Protected Routes

Routes with `requiresAuth: true` require a valid JWT token:

```bash
curl http://localhost:3000/api/v1/users \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### Request Enrichment

Authenticated requests automatically include:
- `X-User-Id`: User identifier from JWT
- `X-User-Role`: User role from JWT

## Running the Gateway

```bash
elide serve server.ts
```

The API Gateway will start on `http://localhost:3000`.

## Example: Complete Workflow

```bash
# 1. Login and get token
TOKEN=$(curl -s -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"pass123"}' \
  | jq -r '.token')

# 2. Make authenticated request
curl http://localhost:3000/api/v1/users \
  -H "Authorization: Bearer $TOKEN"

# 3. Check rate limit headers
curl -i http://localhost:3000/api/v1/users \
  -H "Authorization: Bearer $TOKEN" \
  | grep X-RateLimit

# 4. Create an order
curl -X POST http://localhost:3000/api/v1/orders \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"productId":"prod-123","quantity":2}'

# 5. View cache stats
curl http://localhost:3000/admin/cache/stats

# 6. Invalidate cache
curl -X POST http://localhost:3000/admin/cache/invalidate \
  -H "Content-Type: application/json" \
  -d '{"pattern":"/api/v1/.*"}'
```

## Enterprise Use Cases

- **API Monetization**: Different rate limits for different tiers
- **Security**: Centralized authentication and authorization
- **Performance**: Reduce backend load with caching
- **Observability**: Single point for monitoring and logging
- **Migration**: Support multiple API versions during transitions
- **Transformation**: Adapt legacy APIs to modern formats

## Configuration

### Rate Limits

```typescript
rateLimit: {
  maxRequests: 100,     // Maximum requests
  windowMs: 60000,      // Time window (1 minute)
  identifier: 'client'  // 'client' or 'ip'
}
```

### Cache Settings

```typescript
cache: {
  ttl: 30000  // Time to live in milliseconds
}
```

### Route Configuration

```typescript
{
  path: '/api/v1/users',
  method: 'GET',
  targetUrl: 'http://backend:4001/users',
  version: 'v1',
  requiresAuth: true,
  rateLimit: { /* ... */ },
  cache: { ttl: 30000 },
  transformResponse: (data) => enrichData(data)
}
```

## Production Considerations

- **JWT Secret**: Use environment variables for JWT secret
- **Rate Limit Storage**: Use Redis for distributed rate limiting
- **Cache Backend**: Integrate with Redis or Memcached
- **Monitoring**: Add request logging and metrics
- **Circuit Breaking**: Add circuit breakers for backend services
- **CORS**: Configure CORS policies for web clients

## Why Elide?

This showcase demonstrates Elide's enterprise capabilities:

- **High Performance**: Minimal latency overhead for gateway operations
- **Type Safety**: TypeScript throughout for reliability
- **Standards-Based**: Web standard APIs (Request, Response, Headers)
- **Lightweight**: No heavy framework dependencies
- **Production Ready**: Battle-tested patterns for real-world use
- **Easy Deployment**: Single binary deployment with no dependencies
