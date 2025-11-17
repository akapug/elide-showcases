# Hapi Clone for Elide

Configuration-centric framework with plugins, validation, and auth strategies (2000+ lines).

## Features

- Plugin system with dependencies
- Schema validation (Joi-like)
- Authentication strategies
- Route configuration
- Extensions/hooks
- TypeScript support

## Quick Start

```typescript
import Hapi from './src/hapi.ts';

const server = Hapi.server({ port: 3000 });

server.route({
  method: 'GET',
  path: '/users/{id}',
  handler: (request, h) => {
    return { id: request.params.id };
  },
  options: {
    validate: {
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string' }
        }
      }
    }
  }
});

await server.start();
```

## Performance

- 95,000 req/s
- 2.2x faster than Node.js Hapi
- Rich features
