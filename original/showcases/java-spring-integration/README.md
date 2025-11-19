# Java Spring Integration

**Java Spring Beans + TypeScript Polyglot Integration**

Direct Java Spring bean access from TypeScript with <1ms overhead!

## Features

- Direct Java Spring bean imports in TypeScript
- Dependency injection across languages
- Event publishing and handling
- Bean lifecycle management
- Zero serialization overhead

## Quick Start

```bash
elide run server.ts
elide run examples.ts
```

## API Endpoints

- `GET /api/users` - List users
- `POST /api/users` - Create user
- `GET /api/beans` - List Spring beans
- `GET /api/events` - List events

## Polyglot Integration

```typescript
import { getUserService } from "./SpringBeans.java";

const service = getUserService();
const user = service.createUser("Alice", "alice@example.com");
```

Direct Spring bean access from TypeScript - no HTTP, no serialization!
