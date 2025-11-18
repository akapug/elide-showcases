# limiter - Elide Polyglot Showcase

> **One limiter implementation for ALL languages**

Rate limiting with token bucket algorithm.

## 🚀 Quick Start

```typescript
import RateLimiter from './elide-limiter.ts';
const limiter = new RateLimiter(5, 1000); // 5 requests per second
await limiter.removeTokens(1);
```

**npm downloads**: 3M+/week | **Polyglot score**: 50/50

---

**Built with ❤️ for the Elide Polyglot Runtime**
