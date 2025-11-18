# boom - Elide Polyglot Showcase

> **HTTP-friendly error objects for ALL languages** - TypeScript, Python, Ruby, and Java

## Features

- HTTP status code errors
- Rich error metadata
- Hapi framework integration
- **~15M downloads/week on npm**

## Quick Start

```typescript
import boom from './elide-boom.ts';

const err = boom.notFound('User not found');
console.log(err.output.statusCode); // 404

const badRequest = boom.badRequest('Invalid input');
console.log(badRequest.output.payload);
```

## Links

- [Original npm package](https://www.npmjs.com/package/@hapi/boom)

---

**Built with ❤️ for the Elide Polyglot Runtime**
