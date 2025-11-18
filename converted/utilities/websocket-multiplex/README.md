# websocket-multiplex - Elide Polyglot Showcase

> **WebSocket multiplexing for ALL languages** - TypeScript, Python, Ruby, and Java

## Features

- Multiple virtual channels
- Single physical connection
- Channel isolation
- **~10K downloads/week on npm**

## Quick Start

```typescript
import MultiplexClient from './elide-websocket-multiplex.ts';

const ws = new WebSocket('ws://localhost:8080');
const multiplex = new MultiplexClient(ws);

const channel = multiplex.channel('chat');
channel.send({ text: 'Hello!' });
```

## Links

- [Original npm package](https://www.npmjs.com/package/websocket-multiplex)

---

**Built with ❤️ for the Elide Polyglot Runtime**
