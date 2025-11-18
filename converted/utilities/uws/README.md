# uws - Elide Polyglot Showcase

> **Ultra-fast WebSocket server for ALL languages** - TypeScript, Python, Ruby, and Java

## Features

- Ultra-fast WebSocket server
- Built-in pub/sub messaging
- SSL/TLS support
- **~100K downloads/week on npm**

## Quick Start

```typescript
import { App } from './elide-uws.ts';

const app = App();
app.ws('/*', {
  open: (ws) => console.log('Connected'),
  message: (ws, msg, isBinary) => ws.send(msg, isBinary)
});
app.listen(9001, (token) => console.log('Server started'));
```

## Links

- [Original npm package](https://www.npmjs.com/package/uws)

---

**Built with ❤️ for the Elide Polyglot Runtime**
