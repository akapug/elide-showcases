# IBAN - Elide Polyglot Showcase

> **One IBAN validator for ALL languages** - TypeScript, Python, Ruby, and Java

International Bank Account Number validation and formatting.

## Features

- IBAN validation
- Country code validation
- IBAN formatting
- Zero dependencies
- **~1M downloads/week on npm**

## Quick Start

```typescript
import iban from './elide-iban.ts';

console.log(iban.validate("GB82WEST12345698765432")); // true
console.log(iban.format("GB82WEST12345698765432")); // GB82 WEST 1234 5698 7654 32
```

## Links

- [Original npm package](https://www.npmjs.com/package/iban)

---

**Built with ❤️ for the Elide Polyglot Runtime**
