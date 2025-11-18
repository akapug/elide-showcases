# express-slow-down - Elide Polyglot Showcase

> **One express-slow-down implementation for ALL languages**

Progressive delay middleware for request throttling.

## 🚀 Quick Start

```typescript
import slowDown from './elide-express-slow-down.ts';
const limiter = slowDown({ windowMs: 60000, delayAfter: 5, delayMs: 500 });
app.use(limiter);
```

**npm downloads**: 500K+/week | **Polyglot score**: 50/50

---

**Built with ❤️ for the Elide Polyglot Runtime**
