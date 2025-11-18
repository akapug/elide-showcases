# typedi - Elide Polyglot Showcase

> **Type-safe dependency injection for ALL languages** - TypeScript, Python, Ruby, and Java

## Features

- Token-based service registration
- Singleton and transient scopes
- Service factories
- Multiple container support
- **~300K+ downloads/week on npm**

## Quick Start

```typescript
import { Container, Token } from './elide-typedi.ts';

const container = new Container();
const DB_URL = new Token<string>('DATABASE_URL');

container.set(DB_URL, { value: 'postgresql://localhost/db' });
const url = container.get(DB_URL);

console.log(url);
```

## Links

- [Original npm package](https://www.npmjs.com/package/typedi)

---

**Built with ❤️ for the Elide Polyglot Runtime**
