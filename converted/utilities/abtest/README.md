# ABTest - Simple AB Testing - Elide Polyglot Showcase

> **Simple AB tests for ALL languages** - TypeScript, Python, Ruby, and Java

## 🚀 Quick Start

```typescript
import { createRunner } from './elide-abtest.ts';

const runner = createRunner();
runner.addTest({ name: 'pricing', variants: ['monthly', 'annual'] });

const variant = runner.getVariant('pricing', 'user123');
```

**npm**: ~10K+ downloads/week

---

**Built with ❤️ for the Elide Polyglot Runtime**
