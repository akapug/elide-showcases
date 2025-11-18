# SuperAgent - Fluent HTTP Client - Elide Polyglot Showcase

> **One HTTP client for ALL languages** - TypeScript, Python, Ruby, and Java

Elegant & feature rich HTTP client with a fluent API.

## ✨ Features

- ✅ Fluent API
- ✅ Auto-parse JSON
- ✅ Query string builder
- ✅ **Polyglot**: Works across all languages

## 🚀 Quick Start

```typescript
import { get } from './elide-superagent.ts';

const res = await get('https://api.example.com/users')
  .query({ page: 1 })
  .set('Authorization', 'Bearer token');
```

## 📝 Package Stats

- **npm downloads**: ~15M/week
- **Polyglot score**: 45/50 (A-Tier)

---

**Built with ❤️ for the Elide Polyglot Runtime**
