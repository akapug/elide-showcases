# engine.io-client - Elide Polyglot Showcase

> **Engine.IO client for ALL languages** - TypeScript, Python, Ruby, and Java

## Features

- WebSocket and polling transports
- Automatic transport upgrade
- Heartbeat mechanism
- **~2M downloads/week on npm**

## Quick Start

```typescript
import Socket from './elide-engine.io-client.ts';

const socket = new Socket('ws://localhost:3000');
socket.onopen = () => socket.send('Hello!');
socket.onmessage = (data) => console.log(data);
```

## Links

- [Original npm package](https://www.npmjs.com/package/engine.io-client)

---

**Built with ❤️ for the Elide Polyglot Runtime**
