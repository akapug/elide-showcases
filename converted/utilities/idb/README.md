# IDB - Elide Polyglot Showcase

> **One IndexedDB library for ALL languages** - TypeScript, Python, Ruby, and Java

Tiny promise-based IndexedDB library with a clean, simple API for offline storage.

## Features

- Promise-based API
- Only 1KB minified
- TypeScript support
- Simple CRUD operations
- Transaction management
- Zero dependencies
- **~500K downloads/week on npm**

## Quick Start

```typescript
import { openDB, get, set, del } from './elide-idb.ts';

// Open database
const db = await openDB('my-app', 1, {
  upgrade(db) {
    db.createObjectStore('users');
  }
});

// Store data
await set(db, 'users', { name: 'Alice', age: 30 }, 1);

// Retrieve data
const user = await get(db, 'users', 1);

// Delete data
await del(db, 'users', 1);
```

## Documentation

Run the demo:

```bash
elide run elide-idb.ts
```

## Links

- [Original npm package](https://www.npmjs.com/package/idb)
- [IndexedDB Documentation](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)

---

**Built with ❤️ for the Elide Polyglot Runtime**
