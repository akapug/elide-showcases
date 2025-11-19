/**
 * tRPC Full-Stack Example
 *
 * Demonstrates end-to-end type-safe API with tRPC.
 */

import { initTRPC, TRPCError } from '../src/server/init'
import { z } from '../src/validation/parser'
import { createHTTPServer } from '../src/server/adapters/standalone'
import { createTRPCClient } from '../src/client/client'
import { observable } from '../src/server/observable'

// ============================================================================
// Database (in-memory)
// ============================================================================

const db = {
  users: new Map<string, User>(),
  posts: new Map<string, Post>(),
  sessions: new Map<string, string>()
}

interface User {
  id: string
  name: string
  email: string
  password: string
  createdAt: Date
}

interface Post {
  id: string
  title: string
  content: string
  authorId: string
  published: boolean
  createdAt: Date
}

// Seed data
db.users.set('1', {
  id: '1',
  name: 'Alice',
  email: 'alice@example.com',
  password: 'password123',
  createdAt: new Date()
})

db.posts.set('1', {
  id: '1',
  title: 'Hello tRPC',
  content: 'This is my first post using tRPC!',
  authorId: '1',
  published: true,
  createdAt: new Date()
})

// ============================================================================
// Context
// ============================================================================

const createContext = async ({ req }: any) => {
  const token = req.headers.authorization?.split(' ')[1]
  const userId = db.sessions.get(token || '')
  const user = userId ? db.users.get(userId) : null

  return {
    user,
    db
  }
}

type Context = Awaited<ReturnType<typeof createContext>>

// ============================================================================
// tRPC Setup
// ============================================================================

const t = initTRPC.context<Context>().create({
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

// ============================================================================
// Middleware
// ============================================================================

const isAuthed = t.middleware(async ({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'Not authenticated'
    })
  }

  return next({
    ctx: {
      ...ctx,
      user: ctx.user
    }
  })
})

const logger = t.middleware(async ({ path, type, next }) => {
  const start = Date.now()
  console.log(`➡️  ${type} ${path}`)

  const result = await next()

  const duration = Date.now() - start
  console.log(`✅ ${type} ${path} - ${duration}ms`)

  return result
})

// ============================================================================
// Protected Procedure
// ============================================================================

const protectedProcedure = t.procedure.use(isAuthed)
const loggedProcedure = t.procedure.use(logger)

// ============================================================================
// Routers
// ============================================================================

// Auth router
const authRouter = t.router({
  login: t.procedure
    .input(
      z.object({
        email: z.string().email(),
        password: z.string().min(6)
      })
    )
    .mutation(async ({ input, ctx }) => {
      const user = Array.from(ctx.db.users.values()).find(
        (u) => u.email === input.email && u.password === input.password
      )

      if (!user) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Invalid credentials'
        })
      }

      const token = `token_${user.id}_${Date.now()}`
      ctx.db.sessions.set(token, user.id)

      return {
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email
        }
      }
    }),

  register: t.procedure
    .input(
      z.object({
        name: z.string().min(2),
        email: z.string().email(),
        password: z.string().min(6)
      })
    )
    .mutation(async ({ input, ctx }) => {
      const exists = Array.from(ctx.db.users.values()).some(
        (u) => u.email === input.email
      )

      if (exists) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'User already exists'
        })
      }

      const user: User = {
        id: String(ctx.db.users.size + 1),
        name: input.name,
        email: input.email,
        password: input.password,
        createdAt: new Date()
      }

      ctx.db.users.set(user.id, user)

      const token = `token_${user.id}_${Date.now()}`
      ctx.db.sessions.set(token, user.id)

      return {
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email
        }
      }
    }),

  me: protectedProcedure.query(({ ctx }) => {
    return {
      id: ctx.user.id,
      name: ctx.user.name,
      email: ctx.user.email
    }
  })
})

// User router
const userRouter = t.router({
  list: loggedProcedure.query(({ ctx }) => {
    return Array.from(ctx.db.users.values()).map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      createdAt: u.createdAt
    }))
  }),

  byId: t.procedure
    .input(z.object({ id: z.string() }))
    .query(({ input, ctx }) => {
      const user = ctx.db.users.get(input.id)

      if (!user) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'User not found'
        })
      }

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt
      }
    }),

  update: protectedProcedure
    .input(
      z.object({
        name: z.string().min(2).optional(),
        email: z.string().email().optional()
      })
    )
    .mutation(({ input, ctx }) => {
      const user = ctx.user

      if (input.name) user.name = input.name
      if (input.email) user.email = input.email

      ctx.db.users.set(user.id, user)

      return {
        id: user.id,
        name: user.name,
        email: user.email
      }
    })
})

// Post router
const postRouter = t.router({
  list: t.procedure
    .input(
      z
        .object({
          limit: z.number().min(1).max(100).default(10),
          cursor: z.string().optional()
        })
        .optional()
    )
    .query(({ input, ctx }) => {
      const limit = input?.limit || 10
      const posts = Array.from(ctx.db.posts.values())
        .filter((p) => p.published)
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .slice(0, limit)

      return {
        posts: posts.map((p) => ({
          id: p.id,
          title: p.title,
          content: p.content,
          authorId: p.authorId,
          createdAt: p.createdAt
        })),
        nextCursor: posts.length === limit ? posts[posts.length - 1].id : null
      }
    }),

  byId: t.procedure
    .input(z.object({ id: z.string() }))
    .query(({ input, ctx }) => {
      const post = ctx.db.posts.get(input.id)

      if (!post || !post.published) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Post not found'
        })
      }

      return post
    }),

  create: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1).max(100),
        content: z.string().min(1),
        published: z.boolean().default(false)
      })
    )
    .mutation(({ input, ctx }) => {
      const post: Post = {
        id: String(ctx.db.posts.size + 1),
        title: input.title,
        content: input.content,
        authorId: ctx.user.id,
        published: input.published,
        createdAt: new Date()
      }

      ctx.db.posts.set(post.id, post)

      return post
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        title: z.string().min(1).max(100).optional(),
        content: z.string().min(1).optional(),
        published: z.boolean().optional()
      })
    )
    .mutation(({ input, ctx }) => {
      const post = ctx.db.posts.get(input.id)

      if (!post) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Post not found'
        })
      }

      if (post.authorId !== ctx.user.id) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Not authorized'
        })
      }

      if (input.title) post.title = input.title
      if (input.content) post.content = input.content
      if (input.published !== undefined) post.published = input.published

      ctx.db.posts.set(post.id, post)

      return post
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(({ input, ctx }) => {
      const post = ctx.db.posts.get(input.id)

      if (!post) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Post not found'
        })
      }

      if (post.authorId !== ctx.user.id) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Not authorized'
        })
      }

      ctx.db.posts.delete(input.id)

      return { success: true }
    }),

  // Subscription example
  onCreate: t.procedure.subscription(() => {
    return observable<Post>((emit) => {
      const onPost = (post: Post) => {
        emit.next(post)
      }

      // In a real app, you'd subscribe to a message broker
      // For now, we'll just emit manually

      return () => {
        // Cleanup
      }
    })
  })
})

// ============================================================================
// App Router
// ============================================================================

const appRouter = t.router({
  auth: authRouter,
  user: userRouter,
  post: postRouter,

  // Health check
  health: t.procedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() }
  })
})

export type AppRouter = typeof appRouter

// ============================================================================
// Server
// ============================================================================

const server = createHTTPServer({
  router: appRouter,
  createContext,
  batching: {
    enabled: true
  },
  onError: ({ error, path, type }) => {
    console.error(`❌ Error in ${type} ${path}:`, error)
  }
})

const PORT = 3000

server.listen(PORT, () => {
  console.log(`🚀 tRPC server running on http://localhost:${PORT}`)
})

// ============================================================================
// Client Example
// ============================================================================

/*
import { createTRPCClient } from '../src/client/client'
import type { AppRouter } from './server'

const client = createTRPCClient<AppRouter>({
  url: 'http://localhost:3000',
  headers: {
    authorization: 'Bearer token_here'
  },
  batching: true
})

// Type-safe queries
const health = await client.health.query()
const users = await client.user.list.query()
const user = await client.user.byId.query({ id: '1' })

// Type-safe mutations
const loginResult = await client.auth.login.mutate({
  email: 'alice@example.com',
  password: 'password123'
})

const newPost = await client.post.create.mutate({
  title: 'My New Post',
  content: 'Hello from tRPC!',
  published: true
})

// Batching (automatic)
const [health, users, posts] = await Promise.all([
  client.health.query(),
  client.user.list.query(),
  client.post.list.query({ limit: 10 })
])

// Subscriptions
const subscription = client.post.onCreate.subscribe(undefined, {
  onData: (post) => {
    console.log('New post created:', post)
  },
  onError: (error) => {
    console.error('Subscription error:', error)
  }
})

// Later: unsubscribe
subscription.unsubscribe()
*/
