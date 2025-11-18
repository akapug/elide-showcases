# response-time - Elide Polyglot Showcase

> **Response timing for ALL languages** - TypeScript, Python, Ruby, and Java

## Features

- Response time measurement
- Custom header name
- Callback support
- High-resolution timing
- **~500K downloads/week on npm**

## Quick Start

```typescript
import responseTime from './elide-response-time.ts';

app.use(responseTime());

// With callback
app.use(responseTime((req, res, time) => {
  console.log(`${req.method} ${req.url} - ${time}ms`);
}));
```

## Links

- [Original npm package](https://www.npmjs.com/package/response-time)

---

**Built with ❤️ for the Elide Polyglot Runtime**
