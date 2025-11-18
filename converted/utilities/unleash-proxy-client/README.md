# Unleash Proxy Client - Frontend Feature Flags - Elide Polyglot Showcase

> **One frontend flag system for ALL languages** - TypeScript, Python, Ruby, and Java

Lightweight client for frontend feature flags with real-time updates.

## ✨ Features

- ✅ Lightweight client-side feature flags
- ✅ Real-time toggle updates
- ✅ Context-aware evaluation
- ✅ Variant support for A/B testing
- ✅ Event-driven updates
- ✅ **Polyglot**: Use from TypeScript, Python, Ruby, and Java
- ✅ Zero dependencies

## 🚀 Quick Start

### TypeScript
```typescript
import { createClient } from './elide-unleash-proxy-client.ts';

const client = createClient({
  url: 'https://unleash.example.com/proxy',
  clientKey: 'your-client-key',
  appName: 'my-app',
  context: { userId: 'user123' },
});

await client.start();

if (client.isEnabled('new-ui')) {
  // Show new UI
}
```

## 📖 API Reference

### `createClient(config: ProxyConfig): UnleashProxyClient`

Create a proxy client.

### `start(): Promise<void>`

Start the client and fetch toggles.

### `isEnabled(toggleName: string): boolean`

Check if feature is enabled.

### `getVariant(toggleName: string): VariantData | undefined`

Get A/B test variant.

## 🌐 Links

- [npm unleash-proxy-client](https://www.npmjs.com/package/unleash-proxy-client) (~50K+ downloads/week)

---

**Built with ❤️ for the Elide Polyglot Runtime**
