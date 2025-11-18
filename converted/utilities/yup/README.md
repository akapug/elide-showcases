# Yup - Elide Polyglot Showcase

> **One schema validator for ALL languages** - TypeScript, Python, Ruby, and Java

Dead simple object schema validation with TypeScript-first design.

## Features

- Simple, intuitive API
- Chainable schema definitions
- Type inference and transforms
- Custom error messages
- Zero dependencies
- **~40M downloads/week on npm**

## Quick Start

```typescript
import yup from './elide-yup.ts';

const schema = yup.object({
  username: yup.string().min(3).required(),
  email: yup.string().email().required(),
  age: yup.number().min(18).integer()
});

try {
  const data = schema.validate({
    username: "alice",
    email: "alice@example.com",
    age: 25
  });
  console.log("Valid:", data);
} catch (error) {
  console.log("Errors:", error.errors);
}
```

## Documentation

Run the demo:

```bash
elide run elide-yup.ts
```

## Links

- [Original npm package](https://www.npmjs.com/package/yup)

---

**Built with ❤️ for the Elide Polyglot Runtime**
