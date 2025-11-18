# Koa Compose - Compose Koa Middleware

Compose Koa middleware functions into a single middleware.

Based on [koa-compose](https://www.npmjs.com/package/koa-compose) (~1M+ downloads/week)

## Features

- Koa-style middleware composition
- Async/await support
- Context passing
- Error handling
- Clean stack traces
- Zero dependencies

## Quick Start

```typescript
import compose from './elide-koa-compose.ts';

const middleware = compose([
  async (ctx, next) => {
    console.log('Before');
    await next();
    console.log('After');
  },
  async (ctx, next) => {
    ctx.body = 'Hello World';
  }
]);

await middleware(ctx);
```

## Polyglot Examples

**JavaScript/TypeScript:**
```typescript
const app = compose([logger, auth, handler]);
await app(ctx);
```

**Python (via Elide):**
```python
app = compose([logger, auth, handler])
await app(ctx)
```

**Ruby (via Elide):**
```ruby
app = compose([logger, auth, handler])
app.call(ctx)
```

## Why Polyglot?

- Same Koa pattern across all languages
- Async/await middleware composition
- Share request handling logic
- Clean, modern middleware style
