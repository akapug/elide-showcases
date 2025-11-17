/**
 * GraphQL Yoga Tests
 *
 * Test suite for GraphQL Yoga server functionality.
 */

import { createYoga } from '../src/server/yoga'
import { makeExecutableSchema } from '../src/schema/builder'
import { createPubSub } from '../src/pubsub/pubsub'

describe('GraphQL Yoga', () => {
  describe('Basic Queries', () => {
    const typeDefs = `
      type Query {
        hello: String!
        add(a: Int!, b: Int!): Int!
      }
    `

    const resolvers = {
      Query: {
        hello: () => 'Hello World',
        add: (_: any, { a, b }: { a: number; b: number }) => a + b
      }
    }

    const schema = makeExecutableSchema({ typeDefs, resolvers })
    const yoga = createYoga({ schema })

    test('should execute simple query', async () => {
      const request = new Request('http://localhost/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: '{ hello }' })
      })

      const response = await yoga.handleRequest(request)
      const result = await response.json()

      expect(result.data.hello).toBe('Hello World')
    })

    test('should execute query with arguments', async () => {
      const request = new Request('http://localhost/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: 'query Add($a: Int!, $b: Int!) { add(a: $a, b: $b) }',
          variables: { a: 5, b: 3 }
        })
      })

      const response = await yoga.handleRequest(request)
      const result = await response.json()

      expect(result.data.add).toBe(8)
    })
  })

  describe('Mutations', () => {
    const users = new Map()

    const typeDefs = `
      type Query {
        user(id: ID!): User
      }

      type User {
        id: ID!
        name: String!
      }

      type Mutation {
        createUser(name: String!): User!
      }
    `

    const resolvers = {
      Query: {
        user: (_: any, { id }: { id: string }) => users.get(id)
      },
      Mutation: {
        createUser: (_: any, { name }: { name: string }) => {
          const user = {
            id: String(users.size + 1),
            name
          }
          users.set(user.id, user)
          return user
        }
      }
    }

    const schema = makeExecutableSchema({ typeDefs, resolvers })
    const yoga = createYoga({ schema })

    test('should execute mutation', async () => {
      const request = new Request('http://localhost/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: 'mutation { createUser(name: "Alice") { id name } }'
        })
      })

      const response = await yoga.handleRequest(request)
      const result = await response.json()

      expect(result.data.createUser.name).toBe('Alice')
      expect(result.data.createUser.id).toBeTruthy()
    })
  })

  describe('Subscriptions', () => {
    test('should create subscription', async () => {
      const pubsub = createPubSub()

      const typeDefs = `
        type Query {
          dummy: String
        }

        type Subscription {
          messageAdded: String!
        }
      `

      const resolvers = {
        Query: {
          dummy: () => 'dummy'
        },
        Subscription: {
          messageAdded: {
            subscribe: () => pubsub.asyncIterator('MESSAGE_ADDED')
          }
        }
      }

      const schema = makeExecutableSchema({ typeDefs, resolvers })

      // Test that subscription can be created
      expect(schema.getSubscriptionType()).toBeTruthy()
    })
  })

  describe('Error Handling', () => {
    const typeDefs = `
      type Query {
        error: String!
      }
    `

    const resolvers = {
      Query: {
        error: () => {
          throw new Error('Test error')
        }
      }
    }

    const schema = makeExecutableSchema({ typeDefs, resolvers })
    const yoga = createYoga({ schema })

    test('should handle errors', async () => {
      const request = new Request('http://localhost/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: '{ error }' })
      })

      const response = await yoga.handleRequest(request)
      const result = await response.json()

      expect(result.errors).toBeTruthy()
      expect(result.errors[0].message).toBe('Test error')
    })
  })

  describe('Context', () => {
    const typeDefs = `
      type Query {
        currentUser: String!
      }
    `

    const resolvers = {
      Query: {
        currentUser: (_: any, __: any, context: any) => {
          return context.user.name
        }
      }
    }

    const schema = makeExecutableSchema({ typeDefs, resolvers })
    const yoga = createYoga({
      schema,
      context: () => ({
        user: { name: 'Test User' }
      })
    })

    test('should provide context to resolvers', async () => {
      const request = new Request('http://localhost/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: '{ currentUser }' })
      })

      const response = await yoga.handleRequest(request)
      const result = await response.json()

      expect(result.data.currentUser).toBe('Test User')
    })
  })

  describe('Batching', () => {
    const typeDefs = `
      type Query {
        hello: String!
        world: String!
      }
    `

    const resolvers = {
      Query: {
        hello: () => 'Hello',
        world: () => 'World'
      }
    }

    const schema = makeExecutableSchema({ typeDefs, resolvers })
    const yoga = createYoga({ schema, batching: true })

    test('should handle batch requests', async () => {
      const request = new Request('http://localhost/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify([
          { query: '{ hello }' },
          { query: '{ world }' }
        ])
      })

      const response = await yoga.handleRequest(request)
      const result = await response.json()

      expect(Array.isArray(result)).toBe(true)
      expect(result[0].data.hello).toBe('Hello')
      expect(result[1].data.world).toBe('World')
    })
  })
})

// Run tests
console.log('GraphQL Yoga Test Suite')
console.log('Tests defined - ready to run with test framework')
