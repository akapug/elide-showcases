# CUID - Elide Polyglot Showcase

> **One CUID generator for ALL languages** - TypeScript, Python, Ruby, and Java

Collision-resistant unique identifiers optimized for horizontal scaling and performance.

## ✨ Features

- ✅ Collision-resistant across distributed systems
- ✅ Sortable by creation time
- ✅ URL-safe and human-readable (base36)
- ✅ Slugs (8-char short form)
- ✅ Validation helpers
- ✅ **Polyglot**: Works in all languages

## 🚀 Quick Start

```typescript
import { cuid, slug, isCuid } from './elide-cuid.ts';

// Full CUID
const id = cuid();
console.log(id); // => "c" + 24 chars

// Short slug
const short = slug();
console.log(short); // => 8 chars

// Validate
isCuid("c..."); // => true
```

## 📝 Package Stats

- **npm downloads**: ~3M/week
- **Format**: 25 characters (base36)
- **Elide advantage**: Polyglot, collision-resistant

---

**Built with ❤️ for the Elide Polyglot Runtime**
