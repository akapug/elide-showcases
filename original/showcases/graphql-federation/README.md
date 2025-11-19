# GraphQL Federation Gateway

A production-ready Apollo Federation gateway implementation that composes multiple GraphQL subgraphs into a unified schema with intelligent query planning and distributed execution.

## Features

- **Schema Stitching**: Automatically composes multiple subgraph schemas into a unified API
- **Federated Types**: Full support for `@key`, `@external`, and `@requires` directives
- **Query Planning**: Intelligent query planning that optimizes subgraph execution
- **Entity Resolution**: Resolves federated entities across multiple subgraphs
- **Apollo Compatible**: Implements the Apollo Federation specification
- **Performance Optimization**: Query caching and parallel subgraph execution
- **Type Safety**: Full TypeScript implementation with strong typing

## Architecture

```
┌─────────────┐
│   Clients   │
└──────┬──────┘
       │
       ▼
┌─────────────────────┐
│  Federation Gateway │ ◄── Schema Composition
└─────────┬───────────┘     Query Planning
          │                 Entity Resolution
    ┌─────┴─────┐
    ▼           ▼
┌────────┐  ┌──────────┐
│ Users  │  │ Products │
│Subgraph│  │ Subgraph │
└────────┘  └──────────┘
```

## Federation Concepts

### Entity Types

Entity types are types that can be extended across subgraphs:

```graphql
# Users subgraph
type User @key(fields: "id") {
  id: ID!
  email: String!
  name: String!
}

# Products subgraph extends User
extend type User @key(fields: "id") {
  id: ID! @external
  products: [Product]
}
```

### Key Fields

The `@key` directive defines which fields uniquely identify an entity:

```graphql
type Product @key(fields: "id") {
  id: ID!
  name: String!
}

# Composite keys are supported
type Review @key(fields: "productId userId") {
  productId: ID!
  userId: ID!
  rating: Int!
}
```

### External Fields

The `@external` directive marks fields owned by another subgraph:

```graphql
extend type User @key(fields: "id") {
  id: ID! @external
  purchases: [Purchase]
}
```

### Field Dependencies

The `@requires` directive specifies field dependencies:

```graphql
type Product @key(fields: "id") {
  id: ID!
  price: Float!
  discountedPrice: Float @requires(fields: "price")
}
```

## Query Planning

The gateway creates an optimized execution plan:

1. **Parse Query**: Extract requested fields and types
2. **Determine Ownership**: Map fields to their owning subgraphs
3. **Plan Steps**: Create sequential or parallel execution steps
4. **Execute**: Fetch data from subgraphs
5. **Merge**: Combine results into unified response

### Example Query Plan

For this query:
```graphql
query {
  user(id: "1") {
    name
    products {
      name
      price
    }
  }
}
```

Execution plan:
```
Step 1 (Parallel):
  ├─ Fetch from Users subgraph: user.name
  └─ Fetch from Products subgraph: user.products

Step 2:
  └─ Resolve Product entities for detailed fields
```

## API Endpoints

### GraphQL Endpoint
```
POST /graphql
Content-Type: application/json

{
  "query": "query { ... }",
  "variables": {},
  "operationName": "GetUser"
}
```

### Health Check
```
GET /health
```

### Schema Introspection
```
GET /schema
```

## Configuration

### Subgraph Registration

```typescript
await gateway.addSubgraph({
  name: 'users',
  url: 'http://users-service:4001/graphql',
  sdl: '...' // Optional, will be fetched if not provided
});
```

### Environment Variables

```bash
# Gateway port
PORT=3000

# Subgraph URLs
USERS_SERVICE_URL=http://users-service:4001/graphql
PRODUCTS_SERVICE_URL=http://products-service:4002/graphql

# Cache settings
QUERY_CACHE_TTL=300
QUERY_CACHE_SIZE=1000
```

## Example Queries

### Simple Query
```graphql
query GetUser {
  user(id: "1") {
    id
    name
    email
  }
}
```

### Federated Query
```graphql
query GetUserWithProducts {
  user(id: "1") {
    name
    products {
      name
      price
    }
  }
}
```

### Multiple Entities
```graphql
query GetMultipleUsers {
  users {
    id
    name
    products {
      id
      name
    }
  }
}
```

## Performance

### Query Caching

Queries are cached using query + variables as the cache key:
- Reduces redundant query planning
- TTL-based cache invalidation
- Configurable cache size

### Parallel Execution

Independent subgraph queries execute in parallel:
```typescript
const promises = plan.map(step => executeStep(step));
const results = await Promise.all(promises);
```

### Connection Pooling

Reuse HTTP connections to subgraphs for better performance.

## Error Handling

The gateway properly propagates errors from subgraphs:

```json
{
  "data": {
    "user": null
  },
  "errors": [
    {
      "message": "User not found",
      "path": ["user"],
      "extensions": {
        "code": "NOT_FOUND",
        "service": "users"
      }
    }
  ]
}
```

## Monitoring

### Metrics

Track these key metrics:
- Query planning time
- Subgraph response times
- Cache hit rates
- Error rates per subgraph
- Entity resolution performance

### Tracing

Implement distributed tracing to track:
- Query execution across subgraphs
- Entity resolution chains
- Performance bottlenecks

## Best Practices

1. **Design Subgraphs by Domain**: Each subgraph should own a specific domain
2. **Minimize Cross-Subgraph Calls**: Design schemas to reduce entity resolution
3. **Use Batching**: Batch entity resolution requests when possible
4. **Cache Aggressively**: Cache query plans and frequently accessed data
5. **Monitor Performance**: Track subgraph response times and optimize slow queries
6. **Version Schemas Carefully**: Use schema versioning for breaking changes
7. **Implement Health Checks**: Ensure all subgraphs are healthy before accepting traffic

## Production Deployment

### Docker Compose

```yaml
version: '3.8'
services:
  gateway:
    build: .
    ports:
      - "3000:3000"
    environment:
      - USERS_SERVICE_URL=http://users:4001/graphql
      - PRODUCTS_SERVICE_URL=http://products:4002/graphql
    depends_on:
      - users
      - products

  users:
    image: users-subgraph:latest
    ports:
      - "4001:4001"

  products:
    image: products-subgraph:latest
    ports:
      - "4002:4002"
```

### Kubernetes

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: federation-gateway
spec:
  replicas: 3
  selector:
    matchLabels:
      app: gateway
  template:
    metadata:
      labels:
        app: gateway
    spec:
      containers:
      - name: gateway
        image: federation-gateway:latest
        ports:
        - containerPort: 3000
        env:
        - name: USERS_SERVICE_URL
          value: "http://users-service:4001/graphql"
        - name: PRODUCTS_SERVICE_URL
          value: "http://products-service:4002/graphql"
```

## Running the Server

```bash
# Install dependencies
npm install

# Start the server
elide serve server.ts

# The server will start on http://localhost:3000
```

## Testing

```bash
# Test a simple query
curl -X POST http://localhost:3000/graphql \
  -H "Content-Type: application/json" \
  -d '{"query": "{ user(id: \"1\") { name } }"}'

# Test federated query
curl -X POST http://localhost:3000/graphql \
  -H "Content-Type: application/json" \
  -d '{"query": "{ user(id: \"1\") { name products { name } } }"}'

# Check health
curl http://localhost:3000/health
```

## Further Reading

- [Apollo Federation Specification](https://www.apollographql.com/docs/federation/)
- [GraphQL Schema Stitching](https://www.graphql-tools.com/docs/schema-stitching/)
- [Distributed GraphQL Architecture](https://principledgraphql.com/)
