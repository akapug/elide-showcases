# GrowthBook - A/B Testing & Feature Flags - Elide Polyglot Showcase

> **Data-driven experiments for ALL languages** - TypeScript, Python, Ruby, and Java

## ✨ Features

- ✅ Feature flags with experiments
- ✅ Statistical A/B testing
- ✅ Targeting rules
- ✅ **Polyglot**: Works everywhere on Elide
- ✅ Zero dependencies

## 🚀 Quick Start

```typescript
import { GrowthBook } from './elide-growthbook.ts';

const gb = new GrowthBook({
  attributes: { id: 'user123' },
  features: {
    'new-checkout': { defaultValue: true }
  }
});

if (gb.isOn('new-checkout')) {
  // Show new checkout
}
```

**npm**: ~30K+ downloads/week

---

**Built with ❤️ for the Elide Polyglot Runtime**
