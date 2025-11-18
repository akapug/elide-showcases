# Koa RateLimit - Rate Limiting Middleware

Simple, flexible rate limiting middleware for Koa applications in Elide.

**POLYGLOT SHOWCASE**: One Koa rate limiter that works across JavaScript, Python, Ruby, and Java via Elide!

Based on [koa-ratelimit](https://www.npmjs.com/package/koa-ratelimit) (~50K+ downloads/week)

## Features

- **Koa middleware** - Easy integration
- **Flexible storage** - Memory, Redis, custom backends
- **Custom key generation** - IP, user ID, API key
- **Header injection** - X-RateLimit-* headers
- **Per-route limits** - Different limits per endpoint

## Quick Start

```typescript
import Koa from 'koa';
import rateLimit from './elide-koa-ratelimit';

const app = new Koa();

app.use(rateLimit({
  max: 100,
  duration: 60000 // 100 requests per minute
}));

app.use(ctx => {
  ctx.body = 'Hello World';
});

app.listen(3000);
```

## Use Cases

### Custom ID Function
```typescript
app.use(rateLimit({
  max: 1000,
  duration: 3600000,
  id: ctx => ctx.state.user?.id || ctx.ip
}));
```

### Per-Route Limiting
```typescript
const authLimiter = rateLimit({
  max: 5,
  duration: 300000
});

router.post('/login', authLimiter, async ctx => {
  // Login logic...
});
```

### Custom Error Message
```typescript
app.use(rateLimit({
  max: 100,
  duration: 60000,
  errorMessage: 'Too many requests, please slow down'
}));
```

## Polyglot Examples

### JavaScript/TypeScript
```typescript
app.use(rateLimit({ max: 100, duration: 60000 }));
```

### Python (via Elide)
```python
from elide_koa_ratelimit import rateLimit

app.use(rateLimit(max=100, duration=60000))
```

### Ruby (via Elide)
```ruby
app.use(rate_limit(max: 100, duration: 60000))
```

### Java (via Elide)
```java
app.use(rateLimit(100, 60000));
```

## API

### `rateLimit(options)`

**Options:**
- `max` (number, default: 2500) - Max requests
- `duration` (number, default: 3600000) - Time window in ms
- `id` (function, default: ctx => ctx.ip) - ID generator
- `headers` (boolean, default: true) - Include rate limit headers
- `errorMessage` (string) - Custom error message
- `throw` (boolean, default: true) - Throw on limit exceeded

## Response Headers

- `X-RateLimit-Limit` - Max requests allowed
- `X-RateLimit-Remaining` - Requests remaining
- `X-RateLimit-Reset` - Timestamp when limit resets
- `Retry-After` - Seconds until limit resets (on 429)

## Run the Demo

```bash
elide run elide-koa-ratelimit.ts
```

## Benefits

- **Simple** - Easy Koa integration
- **Flexible** - Custom ID and storage
- **Standard** - X-RateLimit headers
- **Polyglot** - Works across all Elide languages

## License

MIT
