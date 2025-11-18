# Dexie - Elide Polyglot Showcase

> **One IndexedDB wrapper for ALL languages** - TypeScript, Python, Ruby, and Java

Minimalistic IndexedDB wrapper with a modern, chainable API for complex offline queries.

## Features

- Simple chainable API
- Auto-incrementing primary keys
- Compound indexes
- Queries and filters
- Transactions
- Zero dependencies
- **~300K downloads/week on npm**

## Quick Start

```typescript
import Dexie from './elide-dexie.ts';

// Create database
const db = new Dexie('my-app');
db.version(1).stores({
  users: '++id, name, age',
  posts: '++id, userId, title'
});
await db.open();

// Add data
await db.users.add({ name: 'Alice', age: 30 });

// Query data
const allUsers = await db.users.toArray();
```

## Documentation

Run the demo:

```bash
elide run elide-dexie.ts
```

## Links

- [Original npm package](https://www.npmjs.com/package/dexie)
- [Dexie Documentation](https://dexie.org/)

---

**Built with ❤️ for the Elide Polyglot Runtime**
