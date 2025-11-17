/**
 * Advanced GraphQL Yoga Features Example
 *
 * Demonstrates authentication, file uploads, middleware, and plugins.
 */

import { createYoga } from '../src/server/yoga'
import { makeExecutableSchema } from '../src/schema/builder'
import { useAuth } from '../src/plugins/auth'
import { useLogger } from '../src/plugins/logger'
import { useResponseCache } from '../src/plugins/persisted-operations'
import { GraphQLError } from '../src/graphql/core'
import { GraphQLScalarType } from '../src/graphql/core'

// Custom Upload scalar
const Upload = new GraphQLScalarType({
  name: 'Upload',
  description: 'File upload scalar type',
  parseValue: (value: any) => value,
  serialize: (value: any) => value,
  parseLiteral: (ast: any) => ast.value
})

// Schema with authentication and file uploads
const typeDefs = `
  scalar Upload
  scalar DateTime

  type Query {
    me: User
    users: [User!]! @auth
    adminData: AdminData! @requireRole(role: "admin")
  }

  type User {
    id: ID!
    username: String!
    email: String!
    role: String!
    avatar: String
    createdAt: DateTime!
  }

  type AdminData {
    stats: Stats!
    logs: [String!]!
  }

  type Stats {
    totalUsers: Int!
    activeUsers: Int!
    totalPosts: Int!
  }

  type Mutation {
    login(username: String!, password: String!): AuthPayload!
    register(input: RegisterInput!): AuthPayload!
    uploadAvatar(file: Upload!): User! @auth
    updateProfile(input: UpdateProfileInput!): User! @auth
  }

  input RegisterInput {
    username: String!
    email: String!
    password: String!
  }

  input UpdateProfileInput {
    username: String
    email: String
  }

  type AuthPayload {
    token: String!
    user: User!
  }

  directive @auth on FIELD_DEFINITION
  directive @requireRole(role: String!) on FIELD_DEFINITION
`

// In-memory database
const users = new Map<string, any>()
const tokens = new Map<string, string>()

// Seed admin user
users.set('1', {
  id: '1',
  username: 'admin',
  email: 'admin@example.com',
  password: 'admin123', // In production, use hashed passwords!
  role: 'admin',
  avatar: null,
  createdAt: new Date()
})

// Custom DateTime scalar
const DateTime = new GraphQLScalarType({
  name: 'DateTime',
  description: 'DateTime scalar type',
  serialize: (value: Date) => value.toISOString(),
  parseValue: (value: string) => new Date(value),
  parseLiteral: (ast: any) => new Date(ast.value)
})

// Resolvers
const resolvers = {
  Upload,
  DateTime,

  Query: {
    me: (_: any, __: any, { user }: any) => {
      if (!user) {
        throw new GraphQLError('Not authenticated', {
          extensions: { code: 'UNAUTHENTICATED' }
        })
      }

      return user
    },

    users: (_: any, __: any, { user }: any) => {
      if (!user) {
        throw new GraphQLError('Not authenticated', {
          extensions: { code: 'UNAUTHENTICATED' }
        })
      }

      return Array.from(users.values()).map(u => ({
        ...u,
        password: undefined
      }))
    },

    adminData: (_: any, __: any, { user }: any) => {
      if (!user) {
        throw new GraphQLError('Not authenticated', {
          extensions: { code: 'UNAUTHENTICATED' }
        })
      }

      if (user.role !== 'admin') {
        throw new GraphQLError('Forbidden', {
          extensions: { code: 'FORBIDDEN' }
        })
      }

      return {
        stats: {
          totalUsers: users.size,
          activeUsers: users.size,
          totalPosts: 0
        },
        logs: ['System started', 'User logged in', 'Data accessed']
      }
    }
  },

  Mutation: {
    login: (_: any, { username, password }: any) => {
      const user = Array.from(users.values()).find(
        u => u.username === username && u.password === password
      )

      if (!user) {
        throw new GraphQLError('Invalid credentials', {
          extensions: { code: 'UNAUTHENTICATED' }
        })
      }

      // Generate token (in production, use JWT)
      const token = `token_${user.id}_${Date.now()}`
      tokens.set(token, user.id)

      return {
        token,
        user: { ...user, password: undefined }
      }
    },

    register: (_: any, { input }: any) => {
      // Check if user exists
      const exists = Array.from(users.values()).some(
        u => u.username === input.username || u.email === input.email
      )

      if (exists) {
        throw new GraphQLError('User already exists', {
          extensions: { code: 'BAD_USER_INPUT' }
        })
      }

      // Create user
      const user = {
        id: String(users.size + 1),
        username: input.username,
        email: input.email,
        password: input.password, // In production, hash this!
        role: 'user',
        avatar: null,
        createdAt: new Date()
      }

      users.set(user.id, user)

      // Generate token
      const token = `token_${user.id}_${Date.now()}`
      tokens.set(token, user.id)

      return {
        token,
        user: { ...user, password: undefined }
      }
    },

    uploadAvatar: async (_: any, { file }: any, { user }: any) => {
      if (!user) {
        throw new GraphQLError('Not authenticated', {
          extensions: { code: 'UNAUTHENTICATED' }
        })
      }

      // In a real app, process the file upload here
      const { filename, mimetype, encoding, createReadStream } = await file

      console.log('Uploading file:', filename, mimetype, encoding)

      // Simulate file upload
      const avatarUrl = `/uploads/${user.id}/${filename}`

      // Update user avatar
      user.avatar = avatarUrl
      users.set(user.id, user)

      return { ...user, password: undefined }
    },

    updateProfile: (_: any, { input }: any, { user }: any) => {
      if (!user) {
        throw new GraphQLError('Not authenticated', {
          extensions: { code: 'UNAUTHENTICATED' }
        })
      }

      const updated = {
        ...user,
        ...input
      }

      users.set(user.id, updated)

      return { ...updated, password: undefined }
    }
  }
}

// Create schema
const schema = makeExecutableSchema({
  typeDefs,
  resolvers
})

// Create Yoga with plugins
const yoga = createYoga({
  schema,

  plugins: [
    // Authentication plugin
    useAuth({
      getUser: async (token: string) => {
        const userId = tokens.get(token)

        if (!userId) {
          return null
        }

        const user = users.get(userId)

        return user ? { ...user, password: undefined } : null
      }
    }),

    // Logger plugin
    useLogger({
      level: 'info',
      logRequests: true,
      logOperations: true,
      logErrors: true
    }),

    // Response cache plugin
    useResponseCache({
      ttl: 60000, // 1 minute
      session: (request) => {
        const token = request.headers.get('authorization')?.split(' ')[1]
        return token || ''
      }
    })
  ],

  context: async ({ request }) => {
    // Extract user from request (set by auth plugin)
    const user = (request as any).user

    return {
      request,
      user
    }
  },

  graphiql: true,
  cors: true,
  maskedErrors: false
})

// Start server
import { createServer } from 'http'

const server = createServer(async (req, res) => {
  const request = new Request(`http://localhost:4000${req.url}`, {
    method: req.method,
    headers: req.headers as any,
    body: req.method !== 'GET' && req.method !== 'HEAD' ? (req as any) : undefined
  })

  const response = await yoga.handleRequest(request)

  res.writeHead(response.status, Object.fromEntries(response.headers.entries()))
  res.end(await response.text())
})

const PORT = 4001

server.listen(PORT, () => {
  console.log(`🔐 Secure GraphQL server running on http://localhost:${PORT}/graphql`)
})

// Example queries:

/*

# Register a new user
mutation Register {
  register(input: {
    username: "john",
    email: "john@example.com",
    password: "password123"
  }) {
    token
    user {
      id
      username
      email
      role
    }
  }
}

# Login
mutation Login {
  login(username: "admin", password: "admin123") {
    token
    user {
      id
      username
      email
      role
    }
  }
}

# Get current user (requires authentication)
# Add header: Authorization: Bearer <token>
query Me {
  me {
    id
    username
    email
    role
    createdAt
  }
}

# Get all users (requires authentication)
query Users {
  users {
    id
    username
    email
    role
  }
}

# Get admin data (requires admin role)
query AdminData {
  adminData {
    stats {
      totalUsers
      activeUsers
      totalPosts
    }
    logs
  }
}

# Upload avatar (requires authentication)
mutation UploadAvatar($file: Upload!) {
  uploadAvatar(file: $file) {
    id
    username
    avatar
  }
}

# Update profile (requires authentication)
mutation UpdateProfile {
  updateProfile(input: { username: "john_updated" }) {
    id
    username
    email
  }
}

*/
