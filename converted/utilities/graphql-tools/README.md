# GraphQL Tools - Schema Building Tools - Elide Polyglot Showcase

> **One schema toolkit for ALL languages** - TypeScript, Python, Ruby, and Java

A set of utilities for building and manipulating GraphQL schemas with schema stitching, merging, and transformations.

## ✨ Features

- ✅ Schema stitching and merging
- ✅ Type resolvers
- ✅ Schema delegation
- ✅ Mock servers
- ✅ Schema directives
- ✅ Schema transformations
- ✅ **Polyglot**: Use from TypeScript, Python, Ruby, and Java
- ✅ Zero dependencies

## 🚀 Quick Start

```typescript
import { makeExecutableSchema } from './elide-graphql-tools.ts';

const schema = makeExecutableSchema({
  typeDefs: `
    type Query {
      hello: String
    }
  `,
  resolvers: {
    Query: {
      hello: () => 'Hello, World!'
    }
  }
});
```

## 📝 Package Stats

- **npm downloads**: ~15M/week
- **Use case**: GraphQL schema building
- **Elide advantage**: One schema toolkit for all languages
- **Polyglot score**: 50/50 (S-Tier)

---

**Built with ❤️ for the Elide Polyglot Runtime**
