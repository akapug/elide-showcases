# Cockatiel - Elide Polyglot Showcase

> **One circuit breaker for ALL languages** - TypeScript, Python, Ruby, and Java

Implements circuit breaker pattern for fault tolerance.

## Features

- Circuit breaker pattern
- Failure threshold
- Automatic recovery
- State tracking
- Fallback support
- Zero dependencies

## Quick Start

```typescript
import CircuitBreaker from './elide-cockatiel.ts';

const breaker = new CircuitBreaker(async () => {
  return await externalService.call();
}, {
  failureThreshold: 5,
  successThreshold: 2,
  resetTimeout: 60000,
  onStateChange: (state) => console.log(`Circuit `)
});

try {
  const result = await breaker.execute();
  console.log('Success:', result);
} catch (err) {
  console.log('Failed:', err);
}
```

## Documentation

Run the demo:

```bash
elide run elide-cockatiel.ts
```

## Links

- [Original npm package](https://www.npmjs.com/package/cockatiel)

---

**Built with ❤️ for the Elide Polyglot Runtime**
