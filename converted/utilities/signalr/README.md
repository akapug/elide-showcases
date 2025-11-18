# signalr - Elide Polyglot Showcase

> **SignalR client for ALL languages** - TypeScript, Python, Ruby, and Java

## Features

- Real-time hub connections
- Automatic reconnection
- Multiple transports
- **~100K downloads/week on npm**

## Quick Start

```typescript
import { HubConnectionBuilder } from './elide-signalr.ts';

const connection = new HubConnectionBuilder()
  .withUrl('http://localhost:5000/chatHub')
  .build();

connection.on('ReceiveMessage', (user, msg) => console.log(`${user}: ${msg}`));
await connection.start();
```

## Links

- [Original npm package](https://www.npmjs.com/package/@microsoft/signalr)

---

**Built with ❤️ for the Elide Polyglot Runtime**
