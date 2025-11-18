# appmetrics - Elide Polyglot Showcase

> **Application metrics for ALL languages** - TypeScript, Python, Ruby, and Java

## Features

- CPU usage monitoring
- Memory usage tracking
- Event loop monitoring
- HTTP request metrics
- **~20K downloads/week on npm**

## Quick Start

```typescript
import appmetrics from './elide-appmetrics.ts';

appmetrics.monitor();

appmetrics.on('cpu', (data) => {
  console.log('CPU:', data.process);
});

appmetrics.recordHttp('/api/users', 'GET', 45, 200);
```

## Links

- [Original npm package](https://www.npmjs.com/package/appmetrics)

---

**Built with ❤️ for the Elide Polyglot Runtime**
