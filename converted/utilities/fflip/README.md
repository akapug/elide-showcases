# FFlip - Feature Flip - Elide Polyglot Showcase

> **Flexible feature flipping for ALL languages** - TypeScript, Python, Ruby, and Java

## 🚀 Quick Start

```typescript
import { create } from './elide-fflip.ts';

const fflip = create({
  features: [{ name: 'premium', criteria: 'isPremium' }],
  criteria: { isPremium: (user) => user.plan === 'premium' }
});

if (fflip.isFeatureEnabled('premium', user)) {
  // Show premium feature
}
```

**npm**: ~10K+ downloads/week

---

**Built with ❤️ for the Elide Polyglot Runtime**
