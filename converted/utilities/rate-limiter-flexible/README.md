# rate-limiter-flexible - Elide Polyglot Showcase

> **One rate-limiter-flexible implementation for ALL languages**

Flexible rate limiter with multiple algorithms and distributed support.

## 🚀 Quick Start

```typescript
import { RateLimiterMemory } from './elide-rate-limiter-flexible.ts';
const limiter = new RateLimiterMemory({ points: 5, duration: 1 });
await limiter.consume('user123', 1);
```

**npm downloads**: 2M+/week | **Polyglot score**: 50/50

---

**Built with ❤️ for the Elide Polyglot Runtime**
