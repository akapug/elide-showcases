# GraphQL Yoga Clone - Elide Port

A feature-complete GraphQL server implementation in Elide, providing a schema-first approach with subscriptions, file uploads, middleware, and comprehensive error handling.

## Features

- **Schema-First GraphQL**: Build type-safe GraphQL APIs with SDL
- **Subscriptions**: Real-time updates via WebSocket
- **File Uploads**: Multipart file upload support
- **Middleware & Plugins**: Extensible architecture
- **Error Handling**: Comprehensive error formatting and handling
- **TypeScript Types**: Full type safety throughout
- **Performance**: Optimized query execution and caching
- **Validation**: Built-in query and schema validation

## Installation

```bash
elide install graphql-yoga-clone
```

## Quick Start

```typescript
import { createYoga } from './server/yoga'
import { makeExecutableSchema } from './schema/builder'
import { createServer } from 'http'

// Define your schema
const typeDefs = `
  type Query {
    hello(name: String!): String!
    users: [User!]!
  }

  type User {
    id: ID!
    name: String!
    email: String!
  }

  type Mutation {
    createUser(name: String!, email: String!): User!
  }

  type Subscription {
    userCreated: User!
  }
`

// Define resolvers
const resolvers = {
  Query: {
    hello: (_, { name }) => `Hello ${name}!`,
    users: () => [
      { id: '1', name: 'Alice', email: 'alice@example.com' },
      { id: '2', name: 'Bob', email: 'bob@example.com' }
    ]
  },
  Mutation: {
    createUser: (_, { name, email }, { pubsub }) => {
      const user = { id: Math.random().toString(), name, email }
      pubsub.publish('USER_CREATED', { userCreated: user })
      return user
    }
  },
  Subscription: {
    userCreated: {
      subscribe: (_, __, { pubsub }) => pubsub.asyncIterator('USER_CREATED')
    }
  }
}

// Create schema
const schema = makeExecutableSchema({ typeDefs, resolvers })

// Create Yoga instance
const yoga = createYoga({ schema })

// Start server
const server = createServer(yoga)
server.listen(4000, () => {
  console.log('GraphQL server running on http://localhost:4000/graphql')
})
```

## Middleware & Plugins

```typescript
import { createYoga } from './server/yoga'
import { useAuth } from './plugins/auth'
import { useLogger } from './plugins/logger'
import { usePersistedOperations } from './plugins/persisted-operations'

const yoga = createYoga({
  schema,
  plugins: [
    useAuth({
      getUser: async (token) => {
        // Validate token and return user
        return { id: '1', role: 'admin' }
      }
    }),
    useLogger({
      logFn: (message, args) => console.log(message, args)
    }),
    usePersistedOperations({
      store: new Map()
    })
  ]
})
```

## File Uploads

```typescript
const typeDefs = `
  scalar Upload

  type Mutation {
    uploadFile(file: Upload!): File!
  }

  type File {
    filename: String!
    mimetype: String!
    encoding: String!
  }
`

const resolvers = {
  Mutation: {
    uploadFile: async (_, { file }) => {
      const { filename, mimetype, encoding, createReadStream } = await file
      const stream = createReadStream()

      // Process the file stream
      await saveFile(stream, filename)

      return { filename, mimetype, encoding }
    }
  }
}
```

## Subscriptions

```typescript
import { createPubSub } from './pubsub/pubsub'

const pubsub = createPubSub()

const resolvers = {
  Subscription: {
    messageSent: {
      subscribe: () => pubsub.asyncIterator('MESSAGE_SENT'),
      resolve: (payload) => payload.messageSent
    },
    userTyping: {
      subscribe: withFilter(
        () => pubsub.asyncIterator('USER_TYPING'),
        (payload, variables) => {
          return payload.roomId === variables.roomId
        }
      )
    }
  },
  Mutation: {
    sendMessage: (_, { text }, { pubsub }) => {
      const message = { id: uuid(), text, timestamp: Date.now() }
      pubsub.publish('MESSAGE_SENT', { messageSent: message })
      return message
    }
  }
}
```

## Error Handling

```typescript
import { GraphQLError } from './errors/graphql-error'
import { useErrorHandler } from './plugins/error-handler'

const yoga = createYoga({
  schema,
  plugins: [
    useErrorHandler({
      formatError: (error) => {
        console.error('GraphQL Error:', error)

        if (error.originalError instanceof AuthenticationError) {
          return {
            message: 'Unauthorized',
            extensions: {
              code: 'UNAUTHENTICATED',
              http: { status: 401 }
            }
          }
        }

        return error
      }
    })
  ]
})

// In resolvers
const resolvers = {
  Query: {
    secretData: (_, __, { user }) => {
      if (!user) {
        throw new GraphQLError('Not authenticated', {
          extensions: { code: 'UNAUTHENTICATED' }
        })
      }
      return 'Secret data'
    }
  }
}
```

## Context

```typescript
const yoga = createYoga({
  schema,
  context: async ({ request }) => {
    const token = request.headers.get('authorization')
    const user = await validateToken(token)

    return {
      user,
      db: database,
      pubsub,
      loaders: {
        user: new DataLoader(loadUsers),
        post: new DataLoader(loadPosts)
      }
    }
  }
})
```

## Advanced Features

### Batching & Caching

```typescript
import { DataLoader } from './utils/dataloader'

const userLoader = new DataLoader(async (ids) => {
  const users = await db.users.findMany({ where: { id: { in: ids } } })
  return ids.map(id => users.find(u => u.id === id))
})

const resolvers = {
  Post: {
    author: (post, _, { loaders }) => {
      return loaders.user.load(post.authorId)
    }
  }
}
```

### Persisted Queries

```typescript
import { usePersistedOperations } from './plugins/persisted-operations'

const yoga = createYoga({
  schema,
  plugins: [
    usePersistedOperations({
      store: {
        get: async (hash) => queryStore.get(hash),
        set: async (hash, query) => queryStore.set(hash, query)
      }
    })
  ]
})
```

### Response Caching

```typescript
import { useResponseCache } from './plugins/response-cache'

const yoga = createYoga({
  schema,
  plugins: [
    useResponseCache({
      ttl: 60_000, // 1 minute
      session: (request) => request.headers.get('authorization')
    })
  ]
})
```

## API Documentation

### `createYoga(options)`

Creates a new GraphQL Yoga instance.

**Options:**
- `schema`: GraphQL schema
- `context`: Context factory function
- `plugins`: Array of plugins
- `cors`: CORS configuration
- `graphiql`: Enable GraphiQL interface
- `maskedErrors`: Mask internal errors

### `makeExecutableSchema(options)`

Creates an executable GraphQL schema.

**Options:**
- `typeDefs`: SDL schema definitions
- `resolvers`: Resolver map
- `schemaDirectives`: Custom directives

### Plugins

- `useAuth()`: Authentication plugin
- `useLogger()`: Logging plugin
- `usePersistedOperations()`: Persisted queries
- `useResponseCache()`: Response caching
- `useErrorHandler()`: Error handling
- `useValidationCache()`: Validation caching

## Performance

- **Query Complexity**: Limit query depth and complexity
- **Batching**: Automatic query batching with DataLoader
- **Caching**: Multiple caching layers
- **Lazy Loading**: Lazy field resolution

## Testing

```bash
elide test
```

## License

MIT
