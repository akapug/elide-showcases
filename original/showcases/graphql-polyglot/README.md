# GraphQL Polyglot Showcase

Demonstrates how to build a unified GraphQL API with resolvers implemented in multiple languages using Elide's polyglot runtime.

## Overview

This showcase implements a complete GraphQL server where different resolvers are written in different languages:

- **TypeScript**: User management queries and mutations
- **Python**: Analytics and reporting resolvers (conceptual)
- **Ruby**: Content management system resolvers (conceptual)
- **Java**: Payment processing resolvers (conceptual)

## Architecture

```
┌─────────────────────────────────────────────────┐
│           Unified GraphQL Schema                │
├─────────────────────────────────────────────────┤
│  TypeScript │ Python │ Ruby │ Java             │
│  Resolvers  │ Resolvers│ Resolvers│ Resolvers   │
├─────────────────────────────────────────────────┤
│              Elide Runtime                      │
└─────────────────────────────────────────────────┘
```

## Key Features

### 1. Unified Schema
- Single GraphQL schema definition
- Type-safe across all languages
- Automatic schema validation

### 2. Language-Specific Resolvers
- TypeScript: User CRUD operations
- Python: Complex analytics calculations
- Ruby: Content management workflows
- Java: Transaction processing

### 3. Cross-Language Data Flow
- Resolvers can call other resolvers regardless of language
- Type-safe data passing between languages
- Automatic serialization/deserialization

### 4. Performance
- JIT compilation for all resolvers
- Efficient cross-language communication
- Minimal overhead between language boundaries

## GraphQL Schema

```graphql
type Query {
  # TypeScript resolvers
  user(id: ID!): User
  users(limit: Int = 10, offset: Int = 0): [User!]!

  # Python resolvers
  analytics(userId: ID!, period: String!): Analytics
  report(type: String!, params: ReportParams): Report

  # Ruby resolvers
  post(id: ID!): Post
  posts(category: String, limit: Int = 20): [Post!]!

  # Java resolvers
  transaction(id: ID!): Transaction
  transactions(userId: ID!, status: String): [Transaction!]!
}

type Mutation {
  # TypeScript mutations
  createUser(input: CreateUserInput!): User!
  updateUser(id: ID!, input: UpdateUserInput!): User!
  deleteUser(id: ID!): Boolean!

  # Python mutations
  trackEvent(userId: ID!, event: String!, metadata: JSON): Boolean!

  # Ruby mutations
  createPost(input: CreatePostInput!): Post!
  publishPost(id: ID!): Post!

  # Java mutations
  createTransaction(input: CreateTransactionInput!): Transaction!
  refundTransaction(id: ID!): Transaction!
}
```

## Running the Showcase

```bash
# Run the GraphQL server
elide run server.ts

# Test queries
elide run examples/queries.ts

# Test mutations
elide run examples/mutations.ts
```

## Example Queries

### Get User (TypeScript)
```graphql
query {
  user(id: "1") {
    id
    email
    name
    role
    posts {
      title
      category
    }
    transactions {
      amount
      status
    }
  }
}
```

### Get Analytics (Python)
```graphql
query {
  analytics(userId: "2", period: "7d") {
    pageViews
    sessions
    avgSessionDuration
    topPages
  }
}
```

### List Posts (Ruby)
```graphql
query {
  posts(category: "tutorial", limit: 10) {
    id
    title
    author {
      name
      email
    }
    publishedAt
  }
}
```

### Get Transactions (Java)
```graphql
query {
  transactions(userId: "2", status: "completed") {
    id
    amount
    currency
    createdAt
    user {
      name
      email
    }
  }
}
```

## Example Mutations

### Create User (TypeScript)
```graphql
mutation {
  createUser(input: {
    email: "newuser@example.com"
    name: "New User"
    password: "secure123"
    role: "user"
  }) {
    id
    email
    name
    createdAt
  }
}
```

### Track Event (Python)
```graphql
mutation {
  trackEvent(
    userId: "2"
    event: "page_view"
    metadata: { page: "/products", duration: 45 }
  )
}
```

### Create Post (Ruby)
```graphql
mutation {
  createPost(input: {
    title: "My New Post"
    content: "Great content here"
    category: "tutorial"
    authorId: "1"
  }) {
    id
    title
    status
  }
}
```

### Create Transaction (Java)
```graphql
mutation {
  createTransaction(input: {
    userId: "2"
    amount: 99.99
    currency: "USD"
    description: "Premium subscription"
  }) {
    id
    amount
    status
    createdAt
  }
}
```

## Benefits of Polyglot GraphQL

### 1. Team Autonomy
- Each team uses their preferred language
- Independent resolver development
- No coordination overhead

### 2. Best Tool for the Job
- TypeScript: API and business logic
- Python: Data science and analytics
- Ruby: Content workflows
- Java: Financial transactions

### 3. Gradual Migration
- Migrate one resolver at a time
- No big-bang rewrites
- Test each change independently

### 4. Code Reuse
- Share schema definitions
- Reuse types across languages
- Common utilities in any language

## Real-World Use Cases

### E-commerce Platform
```graphql
query ProductPage($id: ID!) {
  # TypeScript: Product catalog
  product(id: $id) {
    name
    price
    # Python: ML-based recommendations
    recommendations {
      products
      score
    }
    # Ruby: User reviews
    reviews {
      rating
      content
    }
    # Java: Real-time inventory
    inventory {
      available
      warehouse
    }
  }
}
```

### Analytics Dashboard
```graphql
query Dashboard($userId: ID!) {
  # TypeScript: User data
  user(id: $userId) {
    name
    # Python: Analytics
    analytics(period: "30d") {
      pageViews
      conversions
    }
    # Ruby: Content stats
    posts {
      views
      engagement
    }
    # Java: Revenue data
    transactions {
      revenue
      period
    }
  }
}
```

## Performance Considerations

### Resolver Optimization
- Cache frequently accessed data
- Use DataLoader pattern for batching
- Implement field-level caching

### Cross-Language Calls
- Minimize data transfer
- Use efficient serialization
- Batch related queries

### Monitoring
- Track resolver performance by language
- Identify slow resolvers
- Optimize hot paths

## Testing

```bash
# Run all tests
elide test

# Test TypeScript resolvers
elide test tests/user.test.ts

# Test Python resolvers
elide test tests/analytics.test.py

# Test Ruby resolvers
elide test tests/posts.test.rb

# Test Java resolvers
elide test tests/transactions.test.java
```

## Learn More

- [GraphQL Specification](https://graphql.org/learn/)
- [Elide Documentation](https://elide.dev)
- [Polyglot Programming Best Practices](https://elide.dev/docs/polyglot)
