# AJV - Elide Polyglot Showcase

> **One JSON Schema validator for ALL languages** - TypeScript, Python, Ruby, and Java

The fastest JSON Schema validator with support for Draft 7 and custom keywords.

## Features

- JSON Schema Draft 7 support
- Fastest validator in JavaScript
- Custom keywords and formats
- Error reporting with JSON Pointer paths
- Zero dependencies
- **~100M downloads/week on npm**

## Quick Start

```typescript
import AJV from './elide-ajv.ts';

const ajv = new AJV();

const schema = {
  type: "object",
  properties: {
    username: { type: "string", minLength: 3 },
    email: { type: "string", format: "email" }
  },
  required: ["username", "email"]
};

const validate = ajv.compile(schema);

if (validate({ username: "alice", email: "alice@example.com" })) {
  console.log("Valid!");
} else {
  console.log("Errors:", validate.errors);
}
```

## Documentation

Run the demo:

```bash
elide run elide-ajv.ts
```

## Links

- [Original npm package](https://www.npmjs.com/package/ajv)
- [JSON Schema Specification](https://json-schema.org/)

---

**Built with ❤️ for the Elide Polyglot Runtime**
