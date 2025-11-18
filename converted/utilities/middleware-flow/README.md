# Middleware-Flow - Flow Control for Middleware

Advanced flow control for middleware execution.

## Features

- Conditional flow
- Branching logic
- Parallel execution
- Error recovery

## Quick Start

```typescript
import MiddlewareFlow from './elide-middleware-flow.ts';

const flow = new MiddlewareFlow();
flow.add(async (data) => {
  console.log('Processing:', data);
});

await flow.execute(data);
```
