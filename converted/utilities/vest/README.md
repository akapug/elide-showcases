# Vest - Elide Polyglot Showcase

> **One validation framework for ALL languages** - TypeScript, Python, Ruby, and Java

Declarative validation testing framework.

## Features

- Declarative tests
- Async validation
- **~200K downloads/week on npm**

```typescript
import { create, test } from './elide-vest.ts';

const suite = create('user', (data) => {
  test('username', 'Username is required', () => !!data.username);
});
```

---

**Built with ❤️ for the Elide Polyglot Runtime**
