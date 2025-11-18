# RateLimiter - Token Bucket Rate Limiting

Efficient token bucket algorithm for rate limiting in Elide.

**POLYGLOT SHOWCASE**: One rate limiter implementation that works across JavaScript, Python, Ruby, and Java via Elide!

Based on [ratelimiter](https://www.npmjs.com/package/ratelimiter) (~100K+ downloads/week)

## Features

- **Token bucket algorithm** - Efficient O(1) operations
- **Configurable** - Set max requests and duration
- **TTL-based** - Automatic expiration
- **Memory-efficient** - Minimal storage overhead
- **TypeScript native** - Full type safety
- **Zero dependencies** - Pure TypeScript implementation

## Quick Start

```typescript
import { RateLimiter } from "./elide-ratelimiter.ts";

// Create rate limiter (5 requests per 10 seconds)
const limiter = new RateLimiter({
  id: "user:123",
  max: 5,
  duration: 10000
});

// Check rate limit
const result = await limiter.get();
console.log(`Remaining: ${result.remaining}/${result.total}`);
console.log(`Limited: ${result.limited}`);
console.log(`Reset: ${result.reset}`);
```

## Use Cases

### API Rate Limiting
```typescript
const apiLimiter = new RateLimiter({
  id: `api:${apiKey}`,
  max: 100,
  duration: 60000 // 100 requests per minute
});

const result = await apiLimiter.get();
if (result.limited) {
  throw new Error("Rate limit exceeded");
}
```

### Login Throttling
```typescript
const loginLimiter = new RateLimiter({
  id: `login:${username}`,
  max: 5,
  duration: 300000 // 5 attempts per 5 minutes
});

const result = await loginLimiter.get();
if (result.limited) {
  throw new Error("Too many login attempts");
}
```

### Resource Protection
```typescript
const dbLimiter = new RateLimiter({
  id: `db:${userId}`,
  max: 1000,
  duration: 3600000 // 1000 queries per hour
});
```

## Polyglot Examples

### JavaScript/TypeScript
```typescript
const limiter = new RateLimiter({ id: "user:1", max: 100, duration: 60000 });
const result = await limiter.get();
```

### Python (via Elide)
```python
from elide_ratelimiter import RateLimiter

limiter = RateLimiter(id="user:1", max=100, duration=60000)
result = await limiter.get()
```

### Ruby (via Elide)
```ruby
limiter = RateLimiter.new(id: "user:1", max: 100, duration: 60000)
result = limiter.get
```

### Java (via Elide)
```java
var limiter = new RateLimiter("user:1", 100, 60000);
var result = limiter.get();
```

## API

### `new RateLimiter(options)`

Create a new rate limiter.

**Options:**
- `id` (string, required) - Unique identifier
- `max` (number, default: 2500) - Maximum requests
- `duration` (number, default: 3600000) - Time window in ms

### `limiter.get()`

Check rate limit and increment counter.

**Returns:**
```typescript
{
  total: number;      // Maximum requests allowed
  remaining: number;  // Remaining requests
  reset: Date;        // When the limit resets
  limited: boolean;   // Whether limit is exceeded
}
```

### `limiter.reset()`

Reset the rate limiter for this ID.

## Run the Demo

```bash
elide run elide-ratelimiter.ts
```

## Benefits

- **Simple** - Easy token bucket implementation
- **Fast** - O(1) operations
- **Flexible** - Configurable limits and durations
- **Polyglot** - Works across all Elide languages
- **Production-ready** - Battle-tested algorithm

## License

MIT
