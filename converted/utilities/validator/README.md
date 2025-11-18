# Validator - Elide Polyglot Showcase

> **One string validator for ALL languages** - TypeScript, Python, Ruby, and Java

A library of string validators and sanitizers for validating and sanitizing strings.

## Features

- Email, URL, UUID validation
- Credit card validation (Luhn algorithm)
- IP address validation
- String sanitization and normalization
- Zero dependencies
- **~40M downloads/week on npm**

## Quick Start

```typescript
import validator from './elide-validator.ts';

console.log(validator.isEmail("user@example.com")); // true
console.log(validator.isURL("https://example.com")); // true
console.log(validator.isCreditCard("4532015112830366")); // true

const escaped = validator.escape("<script>alert('XSS')</script>");
console.log(escaped); // &lt;script&gt;alert(&#x27;XSS&#x27;)&lt;/script&gt;
```

## Documentation

Run the demo:

```bash
elide run elide-validator.ts
```

## Links

- [Original npm package](https://www.npmjs.com/package/validator)

---

**Built with ❤️ for the Elide Polyglot Runtime**
