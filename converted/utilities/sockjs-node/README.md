# sockjs-node - Elide Polyglot Showcase

> **SockJS server for ALL languages** - TypeScript, Python, Ruby, and Java

## Features

- WebSocket emulation
- Multiple transports
- Session management
- **~50K downloads/week on npm**

## Quick Start

```typescript
import { createServer } from './elide-sockjs-node.ts';

const sockjs = createServer({ prefix: '/echo' });
sockjs.on('connection', (conn) => {
  conn.ondata = (msg) => conn.write(msg);
});
```

## Links

- [Original npm package](https://www.npmjs.com/package/sockjs)

---

**Built with ❤️ for the Elide Polyglot Runtime**
