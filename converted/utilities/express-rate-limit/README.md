# express-rate-limit - Elide Polyglot Showcase

> **One express-rate-limit implementation for ALL languages** - TypeScript, Python, Ruby, and Java

Complete rate limiting middleware with configurable windows, custom stores, and flexible handlers - all in one polyglot implementation.

## ✨ Features

- ✅ Request rate limiting
- ✅ Configurable time windows
- ✅ Custom stores (Redis, Memcached)
- ✅ Skip conditions
- ✅ Custom handlers
- ✅ **Polyglot**: Use from TypeScript, Python, Ruby, and Java

## 🚀 Quick Start

### TypeScript

```typescript
import rateLimit from './elide-express-rate-limit.ts';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

app.use('/api/', limiter);
```

## 📝 Package Stats

- **npm downloads**: 10M+/week
- **Use case**: API rate limiting, DDoS protection
- **Polyglot score**: 50/50 (S-Tier)

---

**Built with ❤️ for the Elide Polyglot Runtime**
