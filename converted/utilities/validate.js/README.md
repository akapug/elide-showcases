# validate.js - Elide Polyglot Showcase

> **One validation library for ALL languages** - TypeScript, Python, Ruby, and Java

Declarative validation library.

## Features

- Declarative validation
- Custom validators
- **~1M downloads/week on npm**

```typescript
import validate from './elide-validate.js.ts';

const constraints = {
  email: { presence: true, email: true }
};

const errors = validate.validate({ email: "user@example.com" }, constraints);
```

---

**Built with ❤️ for the Elide Polyglot Runtime**
