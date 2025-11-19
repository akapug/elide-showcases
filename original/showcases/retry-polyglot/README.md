# Retry Polyglot Pattern

Automatic retry with multiple strategies for handling transient failures.

## Strategies

- **Exponential Backoff** (Go): Standard backoff with jitter
- **Adaptive Retry** (Python): ML-based retry decisions
- **Circuit Integration** (Java): Combined with circuit breaker
- **Coordinator** (TypeScript): Retry orchestration

## Running

```bash
elide run server.ts
```

## Benefits

- Automatic retry on transient failures
- Prevents overwhelming failing services
- ML-based adaptive strategies
- Circuit breaker integration
