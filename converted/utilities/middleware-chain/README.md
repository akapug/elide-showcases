# Middleware-Chain - Chain Middleware Functions

Chain multiple middleware functions together.

## Features

- Chain middleware functions
- Async support
- Error handling
- Conditional execution

## Quick Start

```typescript
import createChain from './elide-middleware-chain.ts';

const chain = createChain();
chain.use(async (data, next) => {
  console.log('Step 1');
  await next();
});

await chain.execute(data);
```
