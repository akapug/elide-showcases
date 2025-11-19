# Saga Pattern Polyglot

Distributed transaction management with automatic compensation across multiple services.

## Services

- **Orchestrator** (TypeScript): Saga coordination
- **Order Service** (Python): Order management
- **Payment Service** (Go): Payment processing
- **Inventory Service** (Java): Stock management
- **Notification Service** (Ruby): User notifications

## Running

```bash
elide run server.ts
```

## Patterns

- Orchestration-based saga
- Automatic compensation
- Distributed transactions
- Service autonomy
