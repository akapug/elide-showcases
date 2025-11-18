# cls-rtracer - Elide Polyglot Showcase

> **Request tracing for ALL languages** - TypeScript, Python, Ruby, and Java

## Features

- Automatic request ID tracking
- CLS-based context storage
- Express middleware
- Async-safe tracking
- **~50K downloads/week on npm**

## Quick Start

```typescript
import ClsRTracer from './elide-cls-rtracer.ts';

app.use(ClsRTracer.middleware());

const id = ClsRTracer.id();
```

## Links

- [Original npm package](https://www.npmjs.com/package/cls-rtracer)

---

**Built with ❤️ for the Elide Polyglot Runtime**
