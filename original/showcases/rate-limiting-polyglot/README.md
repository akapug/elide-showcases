# Rate Limiting Polyglot Pattern

Multiple rate limiting algorithms for API protection and fair resource allocation.

## Algorithms

- **Token Bucket** (Go): Smooth rate limiting with bursts
- **Sliding Window** (Redis): Precise request counting
- **Adaptive Limits** (Python): ML-based dynamic limits
- **Coordinator** (TypeScript): Rate limiter management

## Running

```bash
elide run server.ts
```

## Benefits

- Prevent API abuse
- Fair resource allocation
- Multiple algorithms for different needs
- Per-client isolation
- Adaptive to client behavior
