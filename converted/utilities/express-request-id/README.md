# express-request-id - Elide Polyglot Showcase

> **Request ID tracking for ALL languages** - TypeScript, Python, Ruby, and Java

## Features

- Automatic request ID generation
- Custom ID generators
- Header extraction
- Response header injection
- **~50K downloads/week on npm**

## Quick Start

```typescript
import expressRequestId from './elide-express-request-id.ts';

const middleware = expressRequestId({
  headerName: 'X-Request-Id',
  setHeader: true,
});

// Use in Express
app.use(middleware);
```

## Links

- [Original npm package](https://www.npmjs.com/package/express-request-id)

---

**Built with ❤️ for the Elide Polyglot Runtime**
