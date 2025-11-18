# PouchDB - Elide Polyglot Showcase

> **One offline database for ALL languages** - TypeScript, Python, Ruby, and Java

JavaScript database that syncs with CouchDB for offline-first applications.

## Features

- Offline-first architecture
- CouchDB synchronization
- CRUD operations
- Query engine
- Bulk operations
- Zero dependencies
- **~200K downloads/week on npm**

## Quick Start

```typescript
import PouchDB from './elide-pouchdb.ts';

// Create database
const db = new PouchDB('my-app');

// Store document
await db.put({
  _id: 'user-1',
  name: 'Alice',
  age: 30
});

// Retrieve document
const user = await db.get('user-1');

// Get all documents
const result = await db.allDocs({ include_docs: true });
```

## Documentation

Run the demo:

```bash
elide run elide-pouchdb.ts
```

## Links

- [Original npm package](https://www.npmjs.com/package/pouchdb)
- [PouchDB Documentation](https://pouchdb.com/)

---

**Built with ❤️ for the Elide Polyglot Runtime**
