# hpp - Elide Polyglot Showcase

> **HTTP Parameter Pollution protection for ALL languages** - TypeScript, Python, Ruby, and Java

## Features

- Prevent HTTP parameter pollution attacks
- Whitelist parameter arrays
- Protect query string and body parameters
- Express/Connect middleware compatible
- **~3M downloads/week on npm**

## Quick Start

```typescript
import hpp from './elide-hpp.ts';
import express from 'express';

const app = express();

// Basic protection
app.use(hpp());

// With whitelist (allow specific params to be arrays)
app.use(hpp({
  whitelist: ['filter', 'tags']
}));

// Direct sanitization
import { sanitizeParams } from './elide-hpp.ts';

const clean = sanitizeParams({
  id: ['1', '2'],      // Takes last: '2'
  sort: ['name', 'date'] // Takes last: 'date'
});
```

## What is HPP?

HTTP Parameter Pollution occurs when attackers send multiple parameters with the same name:
```
?id=1&id=2&id=3 OR 1=1
```

Different frameworks handle this differently, leading to vulnerabilities.

## Protection

- Arrays → Last value only (unless whitelisted)
- Prevents injection attacks via duplicated parameters
- Configurable whitelist for legitimate array parameters

## Links

- [Original npm package](https://www.npmjs.com/package/hpp)

---

**Built with ❤️ for the Elide Polyglot Runtime**
