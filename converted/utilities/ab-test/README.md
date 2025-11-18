# AB Test - Simple A/B Testing - Elide Polyglot Showcase

> **Simple A/B testing for ALL languages** - TypeScript, Python, Ruby, and Java

## ✨ Features

- ✅ Simple A/B test variants
- ✅ Weighted distribution
- ✅ User bucketing
- ✅ **Polyglot**: Works everywhere on Elide
- ✅ Zero dependencies

## 🚀 Quick Start

```typescript
import { createTest } from './elide-ab-test.ts';

const test = createTest({
  name: 'button-color',
  variants: [
    { name: 'control', weight: 50, value: 'blue' },
    { name: 'variant-a', weight: 50, value: 'green' },
  ]
});

const color = test.getValue('user123');
```

**npm**: ~20K+ downloads/week

---

**Built with ❤️ for the Elide Polyglot Runtime**
