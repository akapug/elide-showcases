# errorhandler - Elide Polyglot Showcase

> **Development error handler middleware for ALL languages** - TypeScript, Python, Ruby, and Java

## Features

- Pretty error pages in development
- Stack trace display
- Error context
- **~8M downloads/week on npm**

## Quick Start

```typescript
import errorHandler from './elide-errorhandler.ts';
import express from 'express';

const app = express();

// Your routes...

// Add at the end
if (process.env.NODE_ENV === 'development') {
  app.use(errorHandler());
}
```

## Links

- [Original npm package](https://www.npmjs.com/package/errorhandler)

---

**Built with ❤️ for the Elide Polyglot Runtime**
