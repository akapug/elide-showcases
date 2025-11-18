# runtypes - Elide Polyglot Showcase

> **Runtime type validation library for ALL languages** - TypeScript, Python, Ruby, and Java

## Features

- Schema-based validation with type safety
- Custom validation rules
- Async validation support
- Error message customization
- **~100K+ downloads/week on npm**

## Quick Start

```typescript
import { createValidator } from './elide-runtypes.ts';

const validator = createValidator({
  email: { required: true, email: true },
  age: { required: true, min: 18 },
});

const result = validator.validate({ email: 'test@example.com', age: 25 });
console.log(result.valid); // true
```

## Links

- [Original npm package](https://www.npmjs.com/package/runtypes)

---

**Built with ❤️ for the Elide Polyglot Runtime**
