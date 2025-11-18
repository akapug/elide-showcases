# create-error - Elide Polyglot Showcase

> **Create custom error classes for ALL languages** - TypeScript, Python, Ruby, and Java

## Features

- Create custom error classes
- Inheritance support
- Default properties
- **~5M downloads/week on npm**

## Quick Start

```typescript
import createError from './elide-create-error.ts';

const ValidationError = createError('ValidationError', { code: 400 });
const err = new ValidationError('Invalid email', { field: 'email' });

console.log(err.name); // 'ValidationError'
console.log(err.code); // 400
```

## Links

- [Original npm package](https://www.npmjs.com/package/create-error)

---

**Built with ❤️ for the Elide Polyglot Runtime**
