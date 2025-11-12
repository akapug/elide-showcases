# PostgreSQL Client - Elide Polyglot Showcase

> **One PostgreSQL client for ALL languages**

Connect to PostgreSQL databases across your entire stack.

## Features

- ✅ Connection pooling
- ✅ Parameterized queries
- ✅ Transaction support
- ✅ **Polyglot**: Works in all languages

## Quick Start

```typescript
import { Client } from './elide-pg.ts';

const client = new Client({
  host: 'localhost',
  database: 'mydb',
  user: 'user',
  password: 'password'
});

await client.connect();
const result = await client.query('SELECT * FROM users');
await client.end();
```

## Package Stats

- **npm downloads**: ~5M/week
- **Polyglot score**: 45/50 (A-Tier)

---

**Built with ❤️ for the Elide Polyglot Runtime**
