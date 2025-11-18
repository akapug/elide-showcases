# rxjs - Elide Polyglot Showcase

> **One RxJS implementation for ALL languages** - TypeScript, Python, Ruby, and Java

Reactive programming with Observable streams - all in one polyglot implementation.

## ✨ Features

- ✅ Observable streams
- ✅ Operators (map, filter, take, tap, etc.)
- ✅ Subject for multicasting
- ✅ **Polyglot**: Use from TypeScript, Python, Ruby, and Java
- ✅ Zero dependencies

## 🚀 Quick Start

```typescript
import { Observable, map, filter } from './elide-rxjs.ts';

Observable.of(1, 2, 3, 4, 5)
  .pipe(
    map(x => x * 2),
    filter(x => x > 5)
  )
  .subscribe(x => console.log(x));
```

## 📝 Package Stats

- **npm downloads**: 50M+/week
- **Use case**: Reactive programming, event streams, async operations
- **Polyglot score**: 47/50 (S-Tier)

---

**Built with ❤️ for the Elide Polyglot Runtime**
