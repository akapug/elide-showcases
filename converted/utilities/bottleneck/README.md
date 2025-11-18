# bottleneck - Elide Polyglot Showcase

> **One bottleneck implementation for ALL languages**

Rate limiter with job queuing and reservoir limiting.

## 🚀 Quick Start

```typescript
import Bottleneck from './elide-bottleneck.ts';
const limiter = new Bottleneck({ maxConcurrent: 2, minTime: 100 });
await limiter.schedule(() => fetchData());
```

**npm downloads**: 5M+/week | **Polyglot score**: 50/50

---

**Built with ❤️ for the Elide Polyglot Runtime**
