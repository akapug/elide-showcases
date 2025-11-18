# rpc-websockets - Elide Polyglot Showcase

> **JSON-RPC 2.0 over WebSocket for ALL languages** - TypeScript, Python, Ruby, and Java

## Features

- JSON-RPC 2.0 protocol
- Client and server support
- Method registration
- **~100K downloads/week on npm**

## Quick Start

```typescript
import { Client, Server } from './elide-rpc-websockets.ts';

const client = new Client('ws://localhost:8080');
const result = await client.call('add', [2, 3]);

const server = new Server({ port: 8080 });
server.register('add', (a, b) => a + b);
```

## Links

- [Original npm package](https://www.npmjs.com/package/rpc-websockets)

---

**Built with ❤️ for the Elide Polyglot Runtime**
