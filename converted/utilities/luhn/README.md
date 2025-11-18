# Luhn - Elide Polyglot Showcase

> **One Luhn validator for ALL languages** - TypeScript, Python, Ruby, and Java

Luhn algorithm for credit card and identification number validation.

## Features

- Luhn algorithm validation
- Check digit generation
- Zero dependencies
- **~300K downloads/week on npm**

## Quick Start

```typescript
import luhn from './elide-luhn.ts';

console.log(luhn.validate("4532015112830366")); // true
console.log(luhn.generate("453201511283036")); // 4532015112830366
```

## Links

- [Original npm package](https://www.npmjs.com/package/luhn)

---

**Built with ❤️ for the Elide Polyglot Runtime**
