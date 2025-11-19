# Circuit Breaker Polyglot Pattern

Prevent cascading failures with automatic circuit breaking and recovery detection.

## Components

- **Circuit Breaker** (TypeScript/Go): State management
- **Failure Analyzer** (Python): ML-based failure analysis
- **Dashboard** (TypeScript): Real-time monitoring

## Running

```bash
elide run server.ts
```

## States

- **CLOSED**: Normal operation
- **OPEN**: Failing, rejecting requests
- **HALF_OPEN**: Testing recovery

## Benefits

- Fast failure during outages
- Automatic recovery detection
- Prevents cascading failures
- Real-time monitoring
