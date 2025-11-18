# Express GraphQL - GraphQL HTTP Middleware - Elide Polyglot Showcase

> **One GraphQL middleware for ALL languages** - TypeScript, Python, Ruby, and Java

An Express middleware for creating GraphQL HTTP servers with GraphiQL interface.

## ✨ Features

- ✅ Express middleware
- ✅ GraphQL HTTP server
- ✅ GraphiQL interface
- ✅ **Polyglot**: Use from TypeScript, Python, Ruby, and Java
- ✅ Zero dependencies

## 🚀 Quick Start

```typescript
import { graphqlHTTP } from './elide-express-graphql.ts';

app.use('/graphql', graphqlHTTP({
  schema: myGraphQLSchema,
  graphiql: true
}));
```

## 📝 Package Stats

- **npm downloads**: ~8M/week
- **Use case**: Express GraphQL middleware
- **Polyglot score**: 48/50 (S-Tier)

---

**Built with ❤️ for the Elide Polyglot Runtime**
