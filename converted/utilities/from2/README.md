# From2 - Create Readable Streams - Elide Polyglot Showcase

> **Stream creation for ALL languages** - TypeScript, Python, Ruby, and Java

## ✨ Features

- ✅ Easy readable stream creation
- ✅ Object mode support
- ✅ **Polyglot**: TypeScript, Python, Ruby, Java

## 🚀 Quick Start

```typescript
import from2 from './elide-from2.ts';

const stream = from2(function(size, next) {
  next(null, 'data');
});

stream.on('data', (data) => console.log(data));
```

## 📝 Package Stats

- **npm downloads**: ~40M/week
- **Polyglot score**: 45/50 (A-Tier)

---

**Built with ❤️ for the Elide Polyglot Runtime**
