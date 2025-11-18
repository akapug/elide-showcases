# Feature Experiments - Experimentation Framework - Elide Polyglot Showcase

> **Feature experiments for ALL languages** - TypeScript, Python, Ruby, and Java

## 🚀 Quick Start

```typescript
import { createExperiments } from './elide-feature-experiments.ts';

const exp = createExperiments();
exp.createExperiment({
  id: 'checkout',
  variants: [
    { id: 'control', weight: 0.5 },
    { id: 'variant-a', weight: 0.5 }
  ]
});

const variant = exp.getVariant('checkout', 'user123');
exp.trackMetric('checkout', 'user123', { name: 'conversion', value: 1 });
```

**npm**: ~5K+ downloads/week

---

**Built with ❤️ for the Elide Polyglot Runtime**
