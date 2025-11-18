# express-mung - Elide Polyglot Showcase

> **Response munging for ALL languages** - TypeScript, Python, Ruby, and Java

## Features

- Response body transformation
- JSON munging
- Header manipulation
- Async transformations
- **~50K downloads/week on npm**

## Quick Start

```typescript
import ExpressMung from './elide-express-mung.ts';

app.use(ExpressMung.json((body, req, res) => {
  return { ...body, timestamp: new Date() };
}));
```

## Links

- [Original npm package](https://www.npmjs.com/package/express-mung)

---

**Built with ❤️ for the Elide Polyglot Runtime**
