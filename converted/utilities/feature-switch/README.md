# Feature Switch - Feature Control - Elide Polyglot Showcase

> **Feature switching for ALL languages** - TypeScript, Python, Ruby, and Java

## 🚀 Quick Start

```typescript
import { createSwitch } from './elide-feature-switch.ts';

const features = createSwitch({
  'dark-mode': { enabled: true, group: 'ui' },
  'new-ui': { enabled: false, group: 'ui' }
});

if (features.isEnabled('dark-mode')) {
  // Apply dark mode
}

features.enableGroup('ui'); // Enable all UI features
```

**npm**: ~3K+ downloads/week

---

**Built with ❤️ for the Elide Polyglot Runtime**
