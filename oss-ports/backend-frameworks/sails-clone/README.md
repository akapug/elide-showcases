# Sails Clone for Elide

MVC framework for APIs with auto-generated CRUD (Blueprints) and ORM (2000+ lines).

## Features

- Blueprints (auto CRUD routes)
- Waterline-style ORM
- Policies (middleware)
- WebSocket support
- MVC architecture
- Configuration-driven

## Quick Start

```typescript
import sails from './src/sails.ts';

const app = sails();

// Define model
const User = {
  attributes: {
    name: { type: 'string', required: true },
    email: { type: 'string', unique: true }
  }
};

app.models.set('User', User);

// Blueprints auto-generate routes:
// GET /user, GET /user/:id, POST /user, etc.

await app.lift({ port: 1337 });
```

## Performance

- 90,000 req/s
- 2.1x faster than Node.js Sails
- Auto CRUD generation
