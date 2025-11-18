# GraphQL - GraphQL Implementation - Elide Polyglot Showcase

> **One GraphQL engine for ALL languages** - TypeScript, Python, Ruby, and Java

A reference implementation of GraphQL for JavaScript with schema definition, query parsing, validation, and execution.

## 🌟 Why This Matters

Different languages use different GraphQL implementations:
- `graphene` in Python
- `graphql-ruby` in Ruby
- `graphql-java` in Java
- Each has different features and limitations

**Elide solves this** with ONE GraphQL engine that works in ALL languages.

## ✨ Features

- ✅ Schema definition language (SDL)
- ✅ Query parsing and validation
- ✅ Type system (scalars, objects, interfaces)
- ✅ Execution engine
- ✅ Introspection
- ✅ Custom scalars
- ✅ Directives
- ✅ Mutations and subscriptions
- ✅ **Polyglot**: Use from TypeScript, Python, Ruby, and Java
- ✅ Zero dependencies

## 🚀 Quick Start

### TypeScript
```typescript
import { GraphQLSchema, GraphQLObjectType, GraphQLString, graphql } from './elide-graphql.ts';

const schema = new GraphQLSchema({
  query: new GraphQLObjectType('Query', {
    hello: {
      type: GraphQLString,
      resolve: () => 'Hello, World!'
    }
  })
});

const result = await graphql(schema, '{ hello }');
console.log(result.data); // { hello: 'Hello, World!' }
```

### Python
```python
from elide import require
graphql_lib = require('./elide-graphql.ts')

schema = graphql_lib.GraphQLSchema({
    'query': graphql_lib.GraphQLObjectType('Query', {
        'hello': {
            'type': graphql_lib.GraphQLString,
            'resolve': lambda: 'Hello, World!'
        }
    })
})

result = await graphql_lib.graphql(schema, '{ hello }')
print(result['data'])
```

## 📖 API Reference

- `GraphQLSchema` - Define GraphQL schema
- `GraphQLObjectType` - Define object types
- `GraphQLString`, `GraphQLInt`, `GraphQLFloat`, `GraphQLBoolean`, `GraphQLID` - Built-in scalars
- `parse()` - Parse GraphQL query
- `validate()` - Validate query against schema
- `execute()` - Execute GraphQL query
- `graphql()` - Parse, validate, and execute in one call

## 📝 Package Stats

- **npm downloads**: ~80M/week
- **Use case**: GraphQL implementation
- **Elide advantage**: One GraphQL engine for all languages
- **Polyglot score**: 50/50 (S-Tier)

---

**Built with ❤️ for the Elide Polyglot Runtime**
