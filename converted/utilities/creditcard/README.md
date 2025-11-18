# Credit Card - Elide Polyglot Showcase

> **One credit card validator for ALL languages** - TypeScript, Python, Ruby, and Java

Credit card validation using Luhn algorithm with card type detection.

## Features

- Luhn algorithm validation
- Card type detection (Visa, MasterCard, Amex, Discover)
- Zero dependencies
- **~200K downloads/week on npm**

## Quick Start

```typescript
import creditcard from './elide-creditcard.ts';

console.log(creditcard.validate("4532015112830366")); // true
console.log(creditcard.determineCardType("4532015112830366")); // Visa
```

## Links

- [Original npm package](https://www.npmjs.com/package/creditcard)

---

**Built with ❤️ for the Elide Polyglot Runtime**
