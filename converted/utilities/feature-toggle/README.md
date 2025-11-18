# Feature Toggle - Simple Feature Flags - Elide Polyglot Showcase

> **Simple feature toggles for ALL languages** - TypeScript, Python, Ruby, and Java

## ✨ Features

- ✅ Simple on/off toggles
- ✅ Environment-based toggles
- ✅ User-based toggles
- ✅ Percentage rollouts
- ✅ **Polyglot**: Works everywhere on Elide
- ✅ Zero dependencies

## 🚀 Quick Start

```typescript
import { create } from './elide-feature-toggle.ts';

const toggles = create({
  'new-ui': true,
  'dark-mode': false,
});

if (toggles.isEnabled('new-ui')) {
  // Show new UI
}
```

**npm**: ~10K+ downloads/week

---

**Built with ❤️ for the Elide Polyglot Runtime**
