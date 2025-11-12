# MongoDB - Elide Polyglot Showcase

> **One MongoDB client for ALL languages**

## Quick Start

```typescript
import { MongoClient } from './elide-mongodb.ts';

const client = new MongoClient('mongodb://localhost:27017');
await client.connect();
const db = client.db('mydb');
const collection = db.collection('users');
await collection.insertOne({ name: 'John' });
```

## Package Stats

- **npm downloads**: ~8M/week
- **Polyglot score**: 46/50 (A-Tier)

---

**Built with ❤️ for the Elide Polyglot Runtime**
