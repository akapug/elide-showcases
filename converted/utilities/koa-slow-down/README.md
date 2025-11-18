# Koa Slow Down - Gradual Speed Limiting

Slow down repeated requests with gradual delays in Elide.

Based on [koa-slow-down](https://www.npmjs.com/package/koa-slow-down) (~10K+ downloads/week)

## Quick Start

```typescript
import slowDown from './elide-koa-slow-down';

app.use(slowDown({
  windowMs: 60000,    // 1 minute window
  delayAfter: 5,      // Start slowing after 5 requests
  delayMs: 500        // Add 500ms per request over limit
}));
```

## License

MIT
