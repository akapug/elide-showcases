# tRPC Clone - Elide Port

A complete end-to-end typesafe API implementation in Elide, providing full TypeScript inference from server to client with zero code generation.

## Features

- **End-to-End Type Safety**: Full TypeScript inference from server to client
- **Router System**: Organize APIs with nested routers
- **Procedures**: Define queries, mutations, and subscriptions
- **Middleware**: Compose reusable logic
- **Context**: Share data across procedures
- **Input Validation**: Runtime validation with Zod-like schemas
- **Error Handling**: Typed error handling
- **Client Generation**: Auto-generated type-safe client
- **Batching**: Automatic request batching
- **Subscriptions**: Real-time updates via WebSocket

## Installation

```bash
elide install trpc-clone
```

## Quick Start

### Server

```typescript
import { initTRPC } from './server/init'
import { createHTTPServer } from './server/adapters/standalone'
import { z } from './validation/schema'

// Initialize tRPC
const t = initTRPC.create()

// Create router
const appRouter = t.router({
  greeting: t.procedure
    .input(z.object({ name: z.string() }))
    .query(({ input }) => {
      return { message: `Hello ${input.name}!` }
    }),

  createUser: t.procedure
    .input(z.object({
      name: z.string(),
      email: z.string().email()
    }))
    .mutation(async ({ input }) => {
      const user = await db.users.create(input)
      return user
    })
})

// Export type definition
export type AppRouter = typeof appRouter

// Create HTTP server
const server = createHTTPServer({
  router: appRouter
})

server.listen(3000)
```

### Client

```typescript
import { createTRPCClient } from './client/client'
import type { AppRouter } from './server'

// Create client
const client = createTRPCClient<AppRouter>({
  url: 'http://localhost:3000'
})

// Make requests with full type safety
const greeting = await client.greeting.query({ name: 'Alice' })
console.log(greeting.message) // "Hello Alice!"

const user = await client.createUser.mutate({
  name: 'Bob',
  email: 'bob@example.com'
})
```

## Routers

```typescript
const t = initTRPC.create()

// Nested routers
const userRouter = t.router({
  list: t.procedure.query(() => db.users.findMany()),
  byId: t.procedure
    .input(z.object({ id: z.string() }))
    .query(({ input }) => db.users.findById(input.id)),
  create: t.procedure
    .input(z.object({
      name: z.string(),
      email: z.string().email()
    }))
    .mutation(({ input }) => db.users.create(input))
})

const postRouter = t.router({
  list: t.procedure.query(() => db.posts.findMany()),
  create: t.procedure
    .input(z.object({
      title: z.string(),
      content: z.string()
    }))
    .mutation(({ input }) => db.posts.create(input))
})

// Merge routers
const appRouter = t.router({
  user: userRouter,
  post: postRouter
})

// Client usage
client.user.list.query()
client.user.byId.query({ id: '1' })
client.post.create.mutate({ title: 'Hello', content: 'World' })
```

## Middleware

```typescript
import { initTRPC, TRPCError } from './server/init'

const t = initTRPC.context<{ user?: User }>().create()

// Authentication middleware
const isAuthed = t.middleware(async ({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'Not authenticated'
    })
  }

  return next({
    ctx: {
      user: ctx.user
    }
  })
})

// Logging middleware
const logger = t.middleware(async ({ path, type, next }) => {
  const start = Date.now()
  console.log(`${type} ${path}`)

  const result = await next()

  console.log(`${type} ${path} completed in ${Date.now() - start}ms`)

  return result
})

// Use middleware
const protectedProcedure = t.procedure.use(isAuthed)

const appRouter = t.router({
  secretData: protectedProcedure.query(({ ctx }) => {
    // ctx.user is guaranteed to exist
    return `Secret data for ${ctx.user.name}`
  }),

  publicData: t.procedure.use(logger).query(() => {
    return 'Public data'
  })
})
```

## Context

```typescript
import { inferAsyncReturnType } from './server/types'

// Create context
export const createContext = async ({ req, res }: any) => {
  const token = req.headers.authorization?.split(' ')[1]
  const user = await validateToken(token)

  return {
    user,
    db,
    req,
    res
  }
}

export type Context = inferAsyncReturnType<typeof createContext>

// Initialize with context
const t = initTRPC.context<Context>().create()

// Use context in procedures
const appRouter = t.router({
  me: t.procedure.query(({ ctx }) => {
    return ctx.user
  })
})
```

## Input Validation

```typescript
import { z } from './validation/schema'

const createPostInput = z.object({
  title: z.string().min(1).max(100),
  content: z.string().min(1),
  tags: z.array(z.string()).optional(),
  published: z.boolean().default(false)
})

const appRouter = t.router({
  createPost: t.procedure
    .input(createPostInput)
    .mutation(({ input }) => {
      // input is fully typed and validated
      return db.posts.create(input)
    })
})
```

## Error Handling

```typescript
import { TRPCError } from './server/init'

const appRouter = t.router({
  getUser: t.procedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const user = await db.users.findById(input.id)

      if (!user) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `User with id ${input.id} not found`
        })
      }

      return user
    })
})

// Client error handling
try {
  await client.getUser.query({ id: '999' })
} catch (error) {
  if (error.code === 'NOT_FOUND') {
    console.log('User not found')
  }
}
```

## Subscriptions

```typescript
import { observable } from './server/observable'

const appRouter = t.router({
  onMessage: t.procedure.subscription(() => {
    return observable<Message>((emit) => {
      const handleMessage = (msg: Message) => {
        emit.next(msg)
      }

      eventEmitter.on('message', handleMessage)

      return () => {
        eventEmitter.off('message', handleMessage)
      }
    })
  })
})

// Client usage
const subscription = client.onMessage.subscribe(undefined, {
  onData: (message) => {
    console.log('New message:', message)
  },
  onError: (error) => {
    console.error('Subscription error:', error)
  }
})

// Unsubscribe
subscription.unsubscribe()
```

## Batching

```typescript
// Server
const server = createHTTPServer({
  router: appRouter,
  batching: {
    enabled: true
  }
})

// Client
const client = createTRPCClient<AppRouter>({
  url: 'http://localhost:3000',
  batching: true
})

// These will be batched into a single HTTP request
const [users, posts] = await Promise.all([
  client.user.list.query(),
  client.post.list.query()
])
```

## Meta & Caching

```typescript
const appRouter = t.router({
  getUserById: t.procedure
    .meta({
      cache: true,
      ttl: 60000 // 1 minute
    })
    .input(z.object({ id: z.string() }))
    .query(({ input }) => {
      return db.users.findById(input.id)
    })
})

// Client with cache
const client = createTRPCClient<AppRouter>({
  url: 'http://localhost:3000',
  cache: {
    enabled: true,
    maxAge: 60000
  }
})
```

## React Integration

```typescript
import { createTRPCReact } from './client/react'
import type { AppRouter } from './server'

const trpc = createTRPCReact<AppRouter>()

// Provider
function App() {
  const [trpcClient] = useState(() =>
    trpc.createClient({
      url: 'http://localhost:3000'
    })
  )

  return (
    <trpc.Provider client={trpcClient}>
      <UserList />
    </trpc.Provider>
  )
}

// Use in components
function UserList() {
  const users = trpc.user.list.useQuery()

  if (users.isLoading) return <div>Loading...</div>
  if (users.error) return <div>Error: {users.error.message}</div>

  return (
    <ul>
      {users.data.map(user => (
        <li key={user.id}>{user.name}</li>
      ))}
    </ul>
  )
}

function CreateUser() {
  const createUser = trpc.user.create.useMutation()

  const handleSubmit = async (data: any) => {
    await createUser.mutateAsync(data)
  }

  return <form onSubmit={handleSubmit}>...</form>
}
```

## Type Inference

```typescript
// Infer input types
type CreateUserInput = inferProcedureInput<AppRouter['user']['create']>

// Infer output types
type User = inferProcedureOutput<AppRouter['user']['byId']>

// Infer error types
type AppError = inferProcedureError<AppRouter>

// Infer context type
type AppContext = inferAsyncReturnType<typeof createContext>
```

## Advanced Features

### Transform Data

```typescript
const t = initTRPC.create({
  transformer: {
    serialize: (object) => JSON.stringify(object),
    deserialize: (object) => JSON.parse(object)
  }
})
```

### Custom Error Formatter

```typescript
const t = initTRPC.create({
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError: error.code === 'BAD_REQUEST' ? error.cause : null
      }
    }
  }
})
```

### Response Meta

```typescript
const appRouter = t.router({
  user: {
    list: t.procedure.query(({ ctx }) => {
      return {
        data: users,
        meta: {
          hasMore: true,
          total: 100
        }
      }
    })
  }
})
```

## Performance

- **Request Batching**: Combine multiple requests into one
- **Response Caching**: Cache responses client and server-side
- **Lazy Loading**: Load routers on-demand
- **Code Splitting**: Split client code by router

## Testing

```bash
elide test
```

## License

MIT
