# Redis Rate Limiter - Distributed Rate Limiting

Fast, distributed rate limiting using Redis for Elide applications.

**POLYGLOT SHOWCASE**: One Redis rate limiter that works across JavaScript, Python, Ruby, and Java via Elide!

Based on [redis-rate-limiter](https://www.npmjs.com/package/redis-rate-limiter) (~50K+ downloads/week)

## Features

- **Redis-backed** - Distributed storage
- **Atomic operations** - Lua scripts for consistency
- **Sliding window** - Accurate rate limiting
- **Multi-instance** - Works across servers
- **TypeScript native** - Full type safety

## Quick Start

```typescript
import { RedisRateLimiter } from "./elide-redis-rate-limiter.ts";

// Create Redis rate limiter
const limiter = new RedisRateLimiter({
  interval: 60, // seconds
  maxInInterval: 100 // 100 requests per minute
});

// Check rate limit
const result = await limiter.limit("user:123");

if (!result.allowed) {
  throw new Error("Rate limit exceeded");
}

console.log(`${result.remaining} requests remaining`);
```

## Use Cases

### Distributed API Rate Limiting
```typescript
const apiLimiter = new RedisRateLimiter({
  interval: 60,
  maxInInterval: 1000
});

// Works across all server instances
const result = await apiLimiter.limit(`api:${apiKey}`);
```

### Global User Quotas
```typescript
const quotaLimiter = new RedisRateLimiter({
  interval: 3600, // 1 hour
  maxInInterval: 10000
});

const result = await quotaLimiter.limit(`quota:${userId}`);
```

### Microservices Rate Limiting
```typescript
// Shared rate limit across all microservices
const result = await limiter.limit(`service:${serviceName}:${userId}`);
```

## Polyglot Examples

### JavaScript/TypeScript
```typescript
const limiter = new RedisRateLimiter({ interval: 60, maxInInterval: 100 });
const result = await limiter.limit("user:1");
```

### Python (via Elide)
```python
from elide_redis_rate_limiter import RedisRateLimiter

limiter = RedisRateLimiter(interval=60, maxInInterval=100)
result = await limiter.limit("user:1")
```

### Ruby (via Elide)
```ruby
limiter = RedisRateLimiter.new(interval: 60, maxInInterval: 100)
result = limiter.limit("user:1")
```

### Java (via Elide)
```java
var limiter = new RedisRateLimiter(60, 100);
var result = limiter.limit("user:1");
```

## API

### `new RedisRateLimiter(options, redis?)`

**Options:**
- `interval` (number) - Time window in seconds
- `maxInInterval` (number) - Max requests per interval
- `minDifference` (number, optional) - Min ms between requests

### `limiter.limit(identifier)`

Check rate limit and increment counter.

**Returns:**
```typescript
{
  allowed: boolean;
  remaining: number;
  reset: number;
}
```

### `limiter.get(identifier)`

Get current limit status without incrementing.

**Returns:**
```typescript
{
  count: number;
  remaining: number;
}
```

## Run the Demo

```bash
elide run elide-redis-rate-limiter.ts
```

## Benefits

- **Distributed** - Works across multiple instances
- **Atomic** - Lua scripts ensure consistency
- **Fast** - O(1) Redis operations
- **Scalable** - Handle millions of requests
- **Polyglot** - Works across all Elide languages

## License

MIT
