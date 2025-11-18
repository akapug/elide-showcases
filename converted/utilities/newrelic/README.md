# New Relic - New Relic APM Agent - Elide Polyglot Showcase

> **New Relic for ALL languages** - TypeScript, Python, Ruby, and Java

Application Performance Monitoring agent for New Relic with transactions and custom events.

## ✨ Features

- ✅ Transaction tracking
- ✅ Custom metrics
- ✅ Error tracking
- ✅ Custom events
- ✅ Attributes
- ✅ Segments
- ✅ **Polyglot**: Use from TypeScript, Python, Ruby, and Java
- ✅ Zero dependencies

## 🚀 Quick Start

```typescript
import newrelic from './elide-newrelic.ts';

newrelic.setTransactionName('GET /api/users');
newrelic.addCustomAttribute('userId', 123);
newrelic.recordMetric('Custom/PageViews', 100);
newrelic.recordCustomEvent('Purchase', { amount: 99.99 });
newrelic.endTransaction();
```

## 📝 Package Stats

- **npm downloads**: ~5M/week
- **Use case**: Application performance monitoring
- **Polyglot score**: 50/50 (S-Tier)

---

**Built with ❤️ for the Elide Polyglot Runtime**
