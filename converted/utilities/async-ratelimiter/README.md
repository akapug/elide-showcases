# Async RateLimiter - Promise-based Rate Limiting

Async/await native rate limiting for modern applications in Elide.

**POLYGLOT SHOWCASE**: One async rate limiter that works across JavaScript, Python, Ruby, and Java via Elide!

Based on [async-ratelimiter](https://www.npmjs.com/package/async-ratelimiter) (~50K+ downloads/week)

## Features

- **Async/await native** - Promise-based API
- **Redis-compatible** - Works with distributed storage
- **Sliding window** - Accurate rate limiting
- **TypeScript native** - Full type safety
- **Zero dependencies** - Pure implementation

## Quick Start

```typescript
import { AsyncRateLimiter } from "./elide-async-ratelimiter.ts";

// Create async rate limiter
const limiter = new AsyncRateLimiter({
  id: "user:123",
  max: 100,
  duration: 60000 // 100 requests per minute
});

// Check rate limit
const info = await limiter.get();
console.log(`${info.remaining}/${info.total} remaining`);

if (info.remaining === 0) {
  throw new Error("Rate limit exceeded");
}
```

## Use Cases

### Async API Endpoint
```typescript
async function handleRequest(userId: string) {
  const limiter = new AsyncRateLimiter({ id: userId, max: 100, duration: 60000 });
  const info = await limiter.get();

  if (info.remaining === 0) {
    return { status: 429, message: "Rate limit exceeded" };
  }

  // Process request...
  return { status: 200, message: "Success" };
}
```

### Check Before Execute
```typescript
const allowed = await limiter.check(); // Don't increment
if (allowed) {
  await limiter.get(); // Now increment
  await executeOperation();
}
```

### Concurrent Requests
```typescript
const promises = requests.map(req =>
  limiter.get().then(info => ({ req, info }))
);
const results = await Promise.all(promises);
```

## Polyglot Examples

### JavaScript/TypeScript
```typescript
const limiter = new AsyncRateLimiter({ id: "user:1", max: 100, duration: 60000 });
const info = await limiter.get();
```

### Python (via Elide)
```python
from elide_async_ratelimiter import AsyncRateLimiter

limiter = AsyncRateLimiter(id="user:1", max=100, duration=60000)
info = await limiter.get()
```

### Ruby (via Elide)
```ruby
limiter = AsyncRateLimiter.new(id: "user:1", max: 100, duration: 60000)
info = limiter.get.await
```

### Java (via Elide)
```java
var limiter = new AsyncRateLimiter("user:1", 100, 60000);
var info = limiter.get().get();
```

## API

### `new AsyncRateLimiter(options, storage?)`

**Options:**
- `id` (string) - Unique identifier
- `max` (number, default: 2500) - Max requests
- `duration` (number, default: 3600000) - Time window in ms

### `limiter.get()`

Get rate limit info and increment counter.

**Returns:**
```typescript
{
  total: number;
  remaining: number;
  reset: Date;
}
```

### `limiter.check()`

Check if request would be allowed (without incrementing).

**Returns:** `Promise<boolean>`

### `limiter.reset()`

Reset rate limiter for this ID.

## Run the Demo

```bash
elide run elide-async-ratelimiter.ts
```

## Benefits

- **Modern** - Async/await native
- **Fast** - Promise-based operations
- **Flexible** - Pluggable storage
- **Polyglot** - Works across all Elide languages

## License

MIT
