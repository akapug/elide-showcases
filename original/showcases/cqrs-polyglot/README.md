# CQRS Polyglot Pattern

Command Query Responsibility Segregation with separate read and write models in different languages.

## Components

- **Command Handler** (TypeScript): Process write operations
- **Command Validator** (Java): Business rule validation
- **Query Handler** (Python): Optimized read operations
- **Search Indexer** (Go): High-performance full-text search

## Running

```bash
elide run server.ts
```

## Benefits

- Separate read/write optimization
- Independent scaling
- Language-specific strengths
- Event-driven consistency
