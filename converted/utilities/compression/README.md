# Compression - Elide Polyglot Showcase

> **One compression middleware for ALL languages**

Compress HTTP responses (gzip, deflate, brotli) across your entire stack.

## Features

- ✅ Gzip, deflate, brotli support
- ✅ Configurable compression level
- ✅ Size threshold
- ✅ **Polyglot**: Works in all languages

## Quick Start

```typescript
import compression from './elide-compression.ts';

app.use(compression({
  level: 6,
  threshold: 1024
}));
```

## Package Stats

- **npm downloads**: ~8M/week
- **Polyglot score**: 37/50 (B-Tier)

---

**Built with ❤️ for the Elide Polyglot Runtime**
