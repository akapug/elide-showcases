/**
 * Basic GraphQL Yoga Server Example
 *
 * Demonstrates basic setup with queries, mutations, and subscriptions.
 */

import { createYoga } from '../src/server/yoga'
import { makeExecutableSchema } from '../src/schema/builder'
import { createPubSub } from '../src/pubsub/pubsub'
import { createServer } from 'http'

// Create PubSub instance
const pubsub = createPubSub()

// Define schema
const typeDefs = `
  type Query {
    hello(name: String!): String!
    users: [User!]!
    user(id: ID!): User
    posts: [Post!]!
    post(id: ID!): Post
  }

  type User {
    id: ID!
    name: String!
    email: String!
    posts: [Post!]!
    createdAt: String!
  }

  type Post {
    id: ID!
    title: String!
    content: String!
    author: User!
    published: Boolean!
    createdAt: String!
  }

  type Mutation {
    createUser(input: CreateUserInput!): User!
    updateUser(id: ID!, input: UpdateUserInput!): User!
    deleteUser(id: ID!): Boolean!
    createPost(input: CreatePostInput!): Post!
    publishPost(id: ID!): Post!
  }

  input CreateUserInput {
    name: String!
    email: String!
  }

  input UpdateUserInput {
    name: String
    email: String
  }

  input CreatePostInput {
    title: String!
    content: String!
    authorId: ID!
  }

  type Subscription {
    userCreated: User!
    postPublished: Post!
  }
`

// In-memory data store
const users = new Map<string, any>()
const posts = new Map<string, any>()

// Seed data
users.set('1', {
  id: '1',
  name: 'Alice',
  email: 'alice@example.com',
  createdAt: new Date().toISOString()
})

users.set('2', {
  id: '2',
  name: 'Bob',
  email: 'bob@example.com',
  createdAt: new Date().toISOString()
})

posts.set('1', {
  id: '1',
  title: 'Hello World',
  content: 'This is my first post!',
  authorId: '1',
  published: true,
  createdAt: new Date().toISOString()
})

posts.set('2', {
  id: '2',
  title: 'GraphQL is Awesome',
  content: 'GraphQL makes API development so much easier!',
  authorId: '1',
  published: false,
  createdAt: new Date().toISOString()
})

// Define resolvers
const resolvers = {
  Query: {
    hello: (_: any, { name }: { name: string }) => {
      return `Hello ${name}!`
    },

    users: () => {
      return Array.from(users.values())
    },

    user: (_: any, { id }: { id: string }) => {
      return users.get(id)
    },

    posts: () => {
      return Array.from(posts.values())
    },

    post: (_: any, { id }: { id: string }) => {
      return posts.get(id)
    }
  },

  User: {
    posts: (user: any) => {
      return Array.from(posts.values()).filter(
        (post) => post.authorId === user.id
      )
    }
  },

  Post: {
    author: (post: any) => {
      return users.get(post.authorId)
    }
  },

  Mutation: {
    createUser: (_: any, { input }: any, { pubsub }: any) => {
      const user = {
        id: String(users.size + 1),
        name: input.name,
        email: input.email,
        createdAt: new Date().toISOString()
      }

      users.set(user.id, user)

      // Publish subscription event
      pubsub.publish('USER_CREATED', { userCreated: user })

      return user
    },

    updateUser: (_: any, { id, input }: any) => {
      const user = users.get(id)

      if (!user) {
        throw new Error('User not found')
      }

      const updated = {
        ...user,
        ...input
      }

      users.set(id, updated)

      return updated
    },

    deleteUser: (_: any, { id }: { id: string }) => {
      const deleted = users.delete(id)

      // Also delete user's posts
      for (const [postId, post] of posts.entries()) {
        if (post.authorId === id) {
          posts.delete(postId)
        }
      }

      return deleted
    },

    createPost: (_: any, { input }: any) => {
      const post = {
        id: String(posts.size + 1),
        title: input.title,
        content: input.content,
        authorId: input.authorId,
        published: false,
        createdAt: new Date().toISOString()
      }

      posts.set(post.id, post)

      return post
    },

    publishPost: (_: any, { id }: { id: string }, { pubsub }: any) => {
      const post = posts.get(id)

      if (!post) {
        throw new Error('Post not found')
      }

      post.published = true
      posts.set(id, post)

      // Publish subscription event
      pubsub.publish('POST_PUBLISHED', { postPublished: post })

      return post
    }
  },

  Subscription: {
    userCreated: {
      subscribe: (_: any, __: any, { pubsub }: any) => {
        return pubsub.asyncIterator('USER_CREATED')
      }
    },

    postPublished: {
      subscribe: (_: any, __: any, { pubsub }: any) => {
        return pubsub.asyncIterator('POST_PUBLISHED')
      }
    }
  }
}

// Create schema
const schema = makeExecutableSchema({ typeDefs, resolvers })

// Create Yoga instance
const yoga = createYoga({
  schema,
  context: async ({ request }) => ({
    request,
    pubsub
  }),
  graphiql: true,
  cors: {
    origin: '*',
    credentials: true
  }
})

// Create HTTP server
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

// Start server
const PORT = process.env.PORT || 4000

server.listen(PORT, () => {
  console.log(`🚀 GraphQL Yoga server running on http://localhost:${PORT}/graphql`)
  console.log(`📊 GraphiQL interface available at http://localhost:${PORT}/graphql`)
})

// Example queries to try:

/*

# Query all users
query GetUsers {
  users {
    id
    name
    email
    posts {
      title
      published
    }
  }
}

# Query specific user
query GetUser {
  user(id: "1") {
    id
    name
    email
    posts {
      id
      title
      content
      published
    }
  }
}

# Create a new user
mutation CreateUser {
  createUser(input: { name: "Charlie", email: "charlie@example.com" }) {
    id
    name
    email
  }
}

# Update user
mutation UpdateUser {
  updateUser(id: "1", input: { name: "Alice Updated" }) {
    id
    name
    email
  }
}

# Create a post
mutation CreatePost {
  createPost(input: { title: "New Post", content: "Content here", authorId: "1" }) {
    id
    title
    content
    author {
      name
    }
  }
}

# Publish a post
mutation PublishPost {
  publishPost(id: "2") {
    id
    title
    published
  }
}

# Subscribe to new users
subscription OnUserCreated {
  userCreated {
    id
    name
    email
  }
}

# Subscribe to published posts
subscription OnPostPublished {
  postPublished {
    id
    title
    author {
      name
    }
  }
}

*/
