# Flagsmith - Open Source Feature Flags - Elide Polyglot Showcase

> **Open-source feature flags for ALL languages** - TypeScript, Python, Ruby, and Java

## ✨ Features

- ✅ Feature flags and remote config
- ✅ User traits and segments
- ✅ Multi-variate flags
- ✅ **Polyglot**: Works everywhere on Elide
- ✅ Zero dependencies

## 🚀 Quick Start

```typescript
import { createFlagsmith } from './elide-flagsmith.ts';

const flagsmith = createFlagsmith({ environmentKey: 'env-key' });
await flagsmith.init();

if (flagsmith.hasFeature('new-dashboard')) {
  // Show new dashboard
}
```

**npm**: ~20K+ downloads/week

---

**Built with ❤️ for the Elide Polyglot Runtime**
