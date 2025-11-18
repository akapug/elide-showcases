# Split.io SDK - Feature Delivery Platform - Elide Polyglot Showcase

> **Feature delivery for ALL languages** - TypeScript, Python, Ruby, and Java

## ✨ Features

- ✅ Feature flags with treatments
- ✅ Real-time split evaluation
- ✅ Attribute-based targeting
- ✅ **Polyglot**: Works everywhere on Elide
- ✅ Zero dependencies

## 🚀 Quick Start

```typescript
import { SplitSdk } from './elide-split-js.ts';

const factory = SplitSdk({ authorizationKey: 'key', key: 'user123' });
const client = factory.client();
await client.ready();

const treatment = client.getTreatment('checkout-flow');
if (treatment === 'variant_a') {
  // Show variant A
}
```

**npm**: ~20K+ downloads/week

---

**Built with ❤️ for the Elide Polyglot Runtime**
