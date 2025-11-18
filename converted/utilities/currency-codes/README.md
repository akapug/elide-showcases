# currency-codes - Elide Polyglot Showcase

> **One currency library for ALL languages** - TypeScript, Python, Ruby, and Java

ISO 4217 currency codes library.

## Features

- Get currency by code
- Get currency by country
- Get currency by number
- Currency symbols
- Decimal digits
- All currencies
- Zero dependencies
- **~100K downloads/week on npm**

## Quick Start

```typescript
import currency from './elide-currency-codes.ts';

const usd = currency.code('USD');
console.log(usd); // { code: 'USD', number: '840', digits: 2, ... }

const eur = currency.number('978');
console.log(eur); // { code: 'EUR', ... }

const us = currency.country('US');
console.log(us); // [{ code: 'USD', ... }]

const all = currency.codes();
console.log(all); // ['USD', 'EUR', 'GBP', ...]
```

## Documentation

Run the demo:

```bash
elide run elide-currency-codes.ts
```

## Links

- [Original npm package](https://www.npmjs.com/package/currency-codes)
- [ISO 4217 Standard](https://en.wikipedia.org/wiki/ISO_4217)

---

**Built with ❤️ for the Elide Polyglot Runtime**
