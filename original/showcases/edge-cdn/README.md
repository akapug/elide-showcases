# Edge CDN Implementation

A production-grade Content Delivery Network (CDN) implementation running at the edge, featuring advanced caching strategies, origin shielding, and intelligent geo-routing.

## Features

### Content Caching
- In-memory cache with configurable size limits (100MB default)
- LRU eviction policy based on hit count and age
- Support for cache-control headers and max-age directives
- ETags for cache validation
- Per-region cache storage

### Origin Shielding
- Request collapsing to prevent thundering herd
- Multiple origin server support with priority-based selection
- Automatic failover to healthy origins
- Health checking and circuit breaking
- Regional origin selection for reduced latency

### Cache Management
- Cache purging with pattern matching
- Stale-while-revalidate support
- Background revalidation
- Cache statistics and monitoring
- Granular cache key generation (encoding, format-aware)

### Geo-Routing
- Automatic region detection from CloudFlare headers
- IP-based geolocation fallback
- Regional origin selection
- Geographic load distribution

### Bandwidth Optimization
- Compression-aware caching (gzip, brotli)
- Content encoding negotiation
- Cache size management
- Efficient binary storage

## API Endpoints

### Content Delivery
```
GET /*
```
Serves cached content or fetches from origin with caching.

Response headers:
- `X-Cache`: HIT, MISS, or STALE
- `X-Cache-Hits`: Number of cache hits for this resource
- `Age`: Time in seconds since cached
- `X-Edge-Region`: Edge region serving the request

### Admin API

#### Cache Statistics
```
GET /_cdn/stats
```
Returns cache utilization metrics.

Response:
```json
{
  "entries": 42,
  "sizeBytes": 12582912,
  "maxSizeBytes": 104857600,
  "utilizationPercent": 12.0
}
```

#### Cache Purging
```
POST /_cdn/purge
Content-Type: application/json

{
  "pattern": "^/api/.*"
}
```
Purges cache entries matching the regex pattern.

Response:
```json
{
  "purged": 15
}
```

## Architecture

### Cache Store
The cache store uses an in-memory Map with intelligent eviction:
- Tracks entry size, hit count, and timestamp
- Evicts least-recently-used, least-frequently-hit entries
- Maintains total size under configured limit

### Origin Shield
Protects origin servers from load spikes:
- Collapses duplicate concurrent requests
- Maintains origin health status
- Implements automatic failover
- Selects optimal origin based on region and health

### Cache Strategies
1. **Fresh**: Serve from cache if within max-age
2. **Stale-while-revalidate**: Serve stale content while fetching fresh
3. **Origin fetch**: Fetch from origin and cache

## Performance Characteristics

- Cache lookup: O(1)
- Cache eviction: O(n) where n = cache entries
- Request collapsing: O(1) map lookup
- Origin selection: O(n) where n = number of origins (typically 3-5)

## Configuration

Modify these constants in the code:
- `maxSize`: Cache size limit (default: 100MB)
- `staleWhileRevalidate`: Time to serve stale content (default: 1 hour)
- Origins array: Configure your backend servers

## Usage Example

```bash
# Start the CDN
deno run --allow-net server.ts

# Fetch content (first request - cache MISS)
curl -I http://localhost:8080/api/data

# Fetch again (cache HIT)
curl -I http://localhost:8080/api/data

# View cache stats
curl http://localhost:8080/_cdn/stats

# Purge API cache
curl -X POST http://localhost:8080/_cdn/purge \
  -H "Content-Type: application/json" \
  -d '{"pattern": "^/api/"}'
```

## Production Considerations

1. **Persistent Cache**: Implement Redis/Memcached for distributed caching
2. **Cache Warming**: Pre-populate cache with frequently accessed content
3. **Monitoring**: Add metrics export (Prometheus, CloudWatch)
4. **Compression**: Implement origin compression and vary by encoding
5. **Security**: Add authentication for admin endpoints
6. **Rate Limiting**: Protect against cache poisoning attacks

## Edge Deployment

This implementation is optimized for edge platforms:
- Cloudflare Workers
- Fastly Compute@Edge
- AWS Lambda@Edge
- Deno Deploy

Adapt the HTTP server initialization for your platform.
