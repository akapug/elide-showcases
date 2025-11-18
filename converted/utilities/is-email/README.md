# is-email - Elide Polyglot Showcase

> **Email validation for ALL languages** - TypeScript, Python, Ruby, and Java

## Features

- RFC-compliant email validation
- Fast regex-based checking
- Domain validation
- Length limit checks (254 chars total, 64 for local, 63 for domain parts)
- **~3M downloads/week on npm**

## Quick Start

```typescript
import isEmail from './elide-is-email.ts';

isEmail('user@example.com');      // true
isEmail('user.name@example.com'); // true
isEmail('invalid@');              // false
isEmail('no-at-sign.com');        // false
```

## Validation Rules

- Must contain exactly one `@`
- Local part (before @) max 64 chars
- Domain part (after @) valid format
- Each domain part max 63 chars
- Total length max 254 chars
- Valid characters per RFC 5322

## Links

- [Original npm package](https://www.npmjs.com/package/is-email)

---

**Built with ❤️ for the Elide Polyglot Runtime**
