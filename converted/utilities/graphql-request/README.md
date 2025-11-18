# GraphQL Request - Minimal GraphQL Client - Elide Polyglot Showcase

> **One minimal GraphQL client for ALL languages** - TypeScript, Python, Ruby, and Java

A minimal GraphQL client for Node.js and browsers with promise-based API.

## ✨ Features

- ✅ Minimal and lightweight
- ✅ Promise-based API
- ✅ TypeScript support
- ✅ Custom headers
- ✅ **Polyglot**: Use from TypeScript, Python, Ruby, and Java
- ✅ Zero dependencies

## 🚀 Quick Start

```typescript
import { request, GraphQLClient } from './elide-graphql-request.ts';

// Simple request
const data = await request(
  'https://api.example.com/graphql',
  `{ users { id name } }`
);

// With client
const client = new GraphQLClient('https://api.example.com/graphql');
const users = await client.request(`{ users { id name } }`);
```

## 📝 Package Stats

- **npm downloads**: ~10M/week
- **Use case**: Minimal GraphQL client
- **Elide advantage**: One minimal client for all languages
- **Polyglot score**: 48/50 (S-Tier)

---

**Built with ❤️ for the Elide Polyglot Runtime**
