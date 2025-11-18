# Cron - Cron Parser and Scheduler - Elide Polyglot Showcase

> **One cron parser for ALL languages** - TypeScript, Python, Ruby, and Java

Parse and validate cron expressions for job scheduling across your polyglot stack.

## ✨ Features

- ✅ Cron expression parsing
- ✅ Next occurrence calculation
- ✅ Expression validation
- ✅ **Polyglot**: Use from TypeScript, Python, Ruby, and Java

## 🚀 Quick Start

```typescript
import { parseExpression } from './elide-cron.ts';

const interval = parseExpression('*/5 * * * *');
console.log('Next run:', interval.next());
```

## 📝 Package Stats

- **npm downloads**: ~10M/week
- **Polyglot score**: 46/50 (S-Tier)

---

**Built with ❤️ for the Elide Polyglot Runtime**
