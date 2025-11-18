# is-valid-domain - Elide Polyglot Showcase

> **Domain validation for ALL languages** - TypeScript, Python, Ruby, and Java

## Features

- Domain name validation
- Subdomain support
- TLD validation
- Length validation (max 253 chars, 63 per label)
- Hyphen validation (not at start/end)
- **~1M downloads/week on npm**

## Quick Start

```typescript
import isValidDomain from './elide-is-valid-domain.ts';

isValidDomain('example.com');                    // true
isValidDomain('sub.example.com');                // true
isValidDomain('deep.sub.example.com');           // true
isValidDomain('example');                        // false (no TLD)
isValidDomain('-example.com');                   // false (hyphen at start)

// Options
isValidDomain('sub.example.com', { subdomain: false }); // false
isValidDomain('example', { topLevel: true });           // true
```

## Options

- `subdomain` (default: true) - Allow subdomains
- `allowUnicode` (default: false) - Allow Unicode characters
- `topLevel` (default: false) - Allow top-level only (no TLD required)

## Validation Rules

- Max 253 characters total
- Max 63 characters per label
- Labels can't start or end with hyphen
- Must have valid TLD (unless `topLevel: true`)
- ASCII only (unless `allowUnicode: true`)

## Links

- [Original npm package](https://www.npmjs.com/package/is-valid-domain)

---

**Built with ❤️ for the Elide Polyglot Runtime**
