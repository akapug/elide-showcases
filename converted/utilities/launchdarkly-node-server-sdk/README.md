# LaunchDarkly Node Server SDK - Enterprise Feature Management - Elide Polyglot Showcase

> **One enterprise flag system for ALL languages** - TypeScript, Python, Ruby, and Java

Enterprise-grade feature flag management and experimentation platform.

## ✨ Features

- ✅ Enterprise feature management
- ✅ Advanced targeting rules
- ✅ Multi-variate experimentation
- ✅ Percentage rollouts
- ✅ User segmentation
- ✅ **Polyglot**: Use from TypeScript, Python, Ruby, and Java
- ✅ Zero dependencies

## 🚀 Quick Start

### TypeScript
```typescript
import { init } from './elide-launchdarkly-node-server-sdk.ts';

const client = init('sdk-key-123');
await client.waitForInitialization();

const user = { key: 'user123', name: 'Alice' };
if (client.variation('new-feature', user, false)) {
  // Show new feature
}
```

## 📖 API Reference

### `init(sdkKey: string, config?: Partial<LDConfig>): LDClient`

Initialize LaunchDarkly client.

### `variation(key: string, user: LDUser, defaultValue: any): any`

Evaluate feature flag.

### `variationDetail(key: string, user: LDUser, defaultValue: any): LDFlagValue`

Evaluate with detailed information.

## 🌐 Links

- [npm launchdarkly-node-server-sdk](https://www.npmjs.com/package/launchdarkly-node-server-sdk) (~50K+ downloads/week)

---

**Built with ❤️ for the Elide Polyglot Runtime**
