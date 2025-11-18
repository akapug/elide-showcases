# Joi - Elide Polyglot Showcase

> **One schema validator for ALL languages** - TypeScript, Python, Ruby, and Java

Powerful object schema validation with a simple, declarative API that works across your entire polyglot stack.

## Features

- Object schema validation with declarative API
- Rich validation rules (string, number, object, array, etc.)
- Custom error messages
- Type coercion and defaults
- Nested object validation
- Zero dependencies
- **~25M downloads/week on npm**

## Quick Start

```typescript
import Joi from './elide-joi.ts';

// Define a schema
const userSchema = Joi.object({
  username: Joi.string().min(3).max(30).required(),
  email: Joi.string().email().required(),
  age: Joi.number().integer().min(18)
});

// Validate data
const result = userSchema.validate({
  username: "alice",
  email: "alice@example.com",
  age: 25
});

if (result.error) {
  console.log("Validation failed:", result.error.message);
} else {
  console.log("Valid data:", result.value);
}
```

## Polyglot Benefits

- ONE schema validator works in TypeScript, Python, Ruby, and Java
- Share validation schemas across your entire stack
- Consistent error messages across all services
- Reduce code duplication and maintenance

## Documentation

Run the demo to see examples:

```bash
elide run elide-joi.ts
```

## Links

- [Original npm package](https://www.npmjs.com/package/joi)
- [Elide Documentation](https://docs.elide.dev)

---

**Built with ❤️ for the Elide Polyglot Runtime**
