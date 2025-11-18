# AB Testing - A/B Test Framework - Elide Polyglot Showcase

> **A/B testing for ALL languages** - TypeScript, Python, Ruby, and Java

## 🚀 Quick Start

```typescript
import { createABTest } from './elide-ab-testing.ts';

const ab = createABTest();
ab.createExperiment({ name: 'button-color', variants: ['blue', 'green'] });

const variant = ab.assign('button-color', 'user123');
ab.convert('button-color', 'user123', 99);
```

**npm**: ~10K+ downloads/week

---

**Built with ❤️ for the Elide Polyglot Runtime**
