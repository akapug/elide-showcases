# Indicative - Elide Polyglot Showcase

> **One schema validator for ALL languages** - TypeScript, Python, Ruby, and Java

Schema-based validation library.

## Features

- Schema-based validation
- Async validation
- **~100K downloads/week on npm**

```typescript
import indicative from './elide-indicative.ts';

await indicative.validate({ email: "user@example.com" }, { email: 'required|email' });
```

---

**Built with ❤️ for the Elide Polyglot Runtime**
