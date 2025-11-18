# verror - Elide Polyglot Showcase

> **Rich JavaScript errors with chaining for ALL languages** - TypeScript, Python, Ruby, and Java

## Features

- Error chaining with cause tracking
- Structured error information
- Printf-style error messages
- **~15M downloads/week on npm**

## Quick Start

```typescript
import { VError } from './elide-verror.ts';

const cause = new Error("Database error");
const err = new VError({
  cause,
  info: { host: 'localhost' }
}, "Failed to fetch user");

console.log(VError.fullStack(err));
console.log(VError.info(err));
```

## Links

- [Original npm package](https://www.npmjs.com/package/verror)

---

**Built with ❤️ for the Elide Polyglot Runtime**
