# Cache-Aside Polyglot Pattern

Caching pattern with multiple cache implementations and ML-based warming.

## Components

- **Cache Service** (TypeScript): Cache-aside coordinator
- **In-Memory Cache** (Go): High-performance local cache
- **Distributed Cache** (Redis): Shared cache layer
- **Cache Warmer** (Python): ML-based predictive warming

## Running

```bash
elide run server.ts
```

## Benefits

- Reduced database load
- Faster response times
- Predictive cache warming
- Automatic invalidation
