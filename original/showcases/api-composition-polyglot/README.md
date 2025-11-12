# API Composition Polyglot

Aggregate data from multiple microservices into unified API endpoints.

## Components

- **Composition Layer** (TypeScript): API orchestration
- **User Service** (Python): User data
- **Product Service** (Go): Product catalog
- **Order Service** (Java): Order management
- **Review Service** (Ruby): User reviews

## Running

```bash
elide run server.ts
```

## Benefits

- Single API for complex queries
- Parallel data fetching
- Reduced client complexity
- Service coordination
