# Passport - Elide Polyglot Showcase

> **One authentication middleware for ALL languages**

Simple and flexible authentication across your entire stack.

## Features

- ✅ Strategy-based authentication
- ✅ Session support
- ✅ Multiple strategies
- ✅ **Polyglot**: Works in all languages

## Quick Start

```typescript
import passport from './elide-passport.ts';

app.use(passport.initialize());
app.post('/login', passport.authenticate('local'));
```

## Package Stats

- **npm downloads**: ~2M/week
- **Polyglot score**: 34/50 (B-Tier)

---

**Built with ❤️ for the Elide Polyglot Runtime**
