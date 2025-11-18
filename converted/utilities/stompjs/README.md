# stompjs - Elide Polyglot Showcase

> **STOMP protocol for ALL languages** - TypeScript, Python, Ruby, and Java

## Features

- STOMP 1.0/1.1/1.2 protocol
- WebSocket transport
- Message queues
- **~50K downloads/week on npm**

## Quick Start

```typescript
import { Client } from './elide-stompjs.ts';

const client = new Client('ws://localhost:61614');
client.connect({}, () => {
  client.subscribe('/queue/messages', (msg) => console.log(msg));
});
```

## Links

- [Original npm package](https://www.npmjs.com/package/stompjs)

---

**Built with ❤️ for the Elide Polyglot Runtime**
