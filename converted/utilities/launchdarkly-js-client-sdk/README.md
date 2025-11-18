# LaunchDarkly JS Client SDK - Elide Polyglot Showcase

> **Frontend feature flags for ALL languages** - TypeScript, Python, Ruby, and Java

## ✨ Features

- ✅ Client-side feature evaluation
- ✅ Real-time flag updates
- ✅ Bootstrap for fast startup
- ✅ **Polyglot**: Works everywhere on Elide
- ✅ Zero dependencies

## 🚀 Quick Start

```typescript
import { initialize } from './elide-launchdarkly-js-client-sdk.ts';

const client = initialize('client-id', { key: 'user123' });
if (client.variation('new-ui', false)) {
  // Show new UI
}
```

**npm**: ~30K+ downloads/week

---

**Built with ❤️ for the Elide Polyglot Runtime**
