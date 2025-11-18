# numbro - Elide Polyglot Showcase

> **One number formatter for ALL languages** - TypeScript, Python, Ruby, and Java

Format numbers with locale support.

## Features

- Localized number formatting
- Currency support
- Percentage formatting
- Zero dependencies
- **~200K downloads/week on npm**

## Quick Start

```typescript
import numbro from './elide-numbro.ts';

console.log(numbro(1234.56).format({ mantissa: 2 }));
console.log(numbro(1234.56).formatCurrency({ mantissa: 2 }));
```

## Documentation

Run the demo:

```bash
elide run elide-numbro.ts
```

## Links

- [Original npm package](https://www.npmjs.com/package/numbro)

---

**Built with ❤️ for the Elide Polyglot Runtime**
