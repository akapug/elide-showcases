# msw - Elide Polyglot Showcase

> **One API mocking library for ALL languages** - TypeScript, Python, Ruby, and Java

Seamless REST/GraphQL API mocking library for browser and Node.js.

## Features

- Mock REST APIs
- Mock GraphQL APIs
- Browser and Node support
- Request interception
- Type-safe mocks
- Zero dependencies
- **~500K downloads/week on npm**

## Quick Start

```typescript
import { rest, setupServer } from './elide-msw.ts';

const handler = rest.get('/api/user', (req, res, ctx) => {
  return { status: 200, body: { name: 'Alice' } };
});

const server = setupServer(handler);
server.listen();
```

## Links

- [Original npm package](https://www.npmjs.com/package/msw)

---

**Built with ❤️ for the Elide Polyglot Runtime**
