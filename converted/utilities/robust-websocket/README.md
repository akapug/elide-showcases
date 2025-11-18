# robust-websocket - Elide Polyglot Showcase

> **Resilient WebSocket client for ALL languages** - TypeScript, Python, Ruby, and Java

## Features

- Automatic reconnection
- Configurable retry strategies
- Message buffering
- **~20K downloads/week on npm**

## Quick Start

```typescript
import RobustWebSocket from './elide-robust-websocket.ts';

const rws = new RobustWebSocket('ws://localhost:8080');
rws.onopen = () => console.log('Connected');
rws.onmessage = (event) => console.log(event.data);
```

## Links

- [Original npm package](https://www.npmjs.com/package/robust-websocket)

---

**Built with ❤️ for the Elide Polyglot Runtime**
