# Rolling Rate Limiter - Sliding Window Rate Limiting

Precise rate limiting with rolling/sliding time windows in Elide.

**POLYGLOT SHOWCASE**: One rolling rate limiter that works across JavaScript, Python, Ruby, and Java via Elide!

Based on [rolling-rate-limiter](https://www.npmjs.com/package/rolling-rate-limiter) (~30K+ downloads/week)

## Features

- **Sliding window** - Precise, no bucket boundaries
- **Timestamp tracking** - Accurate request counting
- **Automatic cleanup** - Old data removed
- **Redis-compatible** - Distributed storage support
- **Zero dependencies** - Pure TypeScript

## Quick Start

```typescript
import { RollingRateLimiter } from "./elide-rolling-rate-limiter.ts";

// Create rolling limiter (5 requests per 10 seconds)
const limiter = new RollingRateLimiter({
  interval: 10000,
  maxInInterval: 5
});

// Check rate limit
const result = await limiter.limit("user:123");

if (!result.allowed) {
  throw new Error("Rate limit exceeded");
}

console.log(`${result.remaining} requests remaining`);
```

## Use Cases

### Precise API Rate Limiting
```typescript
const apiLimiter = new RollingRateLimiter({
  interval: 60000, // 1 minute
  maxInInterval: 100
});

const result = await apiLimiter.limit(`api:${apiKey}`);
```

### Burst Protection
```typescript
const burstLimiter = new RollingRateLimiter({
  interval: 1000, // 1 second
  maxInInterval: 5
});

// Only 5 requests allowed per second, precisely
const result = await burstLimiter.limit("user:123");
```

### Track Current Usage
```typescript
const count = await limiter.count("user:123");
console.log(`${count} requests in current window`);
```

## Polyglot Examples

### JavaScript/TypeScript
```typescript
const limiter = new RollingRateLimiter({ interval: 60000, maxInInterval: 100 });
const result = await limiter.limit("user:1");
```

### Python (via Elide)
```python
from elide_rolling_rate_limiter import RollingRateLimiter

limiter = RollingRateLimiter(interval=60000, maxInInterval=100)
result = await limiter.limit("user:1")
```

### Ruby (via Elide)
```ruby
limiter = RollingRateLimiter.new(interval: 60000, maxInInterval: 100)
result = limiter.limit("user:1")
```

### Java (via Elide)
```java
var limiter = new RollingRateLimiter(60000, 100);
var result = limiter.limit("user:1");
```

## API

### `new RollingRateLimiter(options, storage?)`

**Options:**
- `interval` (number) - Time window in milliseconds
- `maxInInterval` (number) - Max requests per interval

### `limiter.limit(identifier)`

Check rate limit and record timestamp.

**Returns:**
```typescript
{
  allowed: boolean;
  current: number;
  remaining: number;
}
```

### `limiter.count(identifier)`

Get current count in rolling window.

**Returns:** `Promise<number>`

### `limiter.getOldest(identifier)`

Get timestamp of oldest request in window.

**Returns:** `Promise<number | null>`

## Run the Demo

```bash
elide run elide-rolling-rate-limiter.ts
```

## Benefits

- **Precise** - Exact time windows, no bucket boundaries
- **Fair** - Gradual limit recovery
- **Accurate** - Timestamp-based tracking
- **Clean** - Automatic old data removal
- **Polyglot** - Works across all Elide languages

## License

MIT
