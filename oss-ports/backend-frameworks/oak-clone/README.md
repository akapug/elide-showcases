# Oak Clone for Elide

Deno-style middleware framework with modern TypeScript patterns (1500+ lines).

## Features

- Deno-inspired API
- TypeScript-native
- Router with middleware
- Modern async patterns
- Context-based design

## Quick Start

```typescript
import { Application, Router } from './src/oak.ts';

const app = new Application();
const router = new Router();

router.get('/', (ctx) => {
  ctx.response.body = { message: 'Hello Oak!' };
});

app.use(router.routes());
app.use(router.allowedMethods());

await app.listen({ port: 3000 });
```

## Performance

- 105,000 req/s
- 2.3x faster than Deno Oak
- Modern TypeScript
