# websocket-as-promised - Elide Polyglot Showcase

> **Promise-based WebSocket for ALL languages** - TypeScript, Python, Ruby, and Java

## Features

- Promise-based API
- Async/await support
- Request/response pattern
- **~30K downloads/week on npm**

## Quick Start

```typescript
import WebSocketAsPromised from './elide-websocket-as-promised.ts';

const wsp = new WebSocketAsPromised('ws://localhost:8080');
await wsp.open();
await wsp.send({ type: 'ping' });
const response = await wsp.sendRequest({ action: 'getData' });
```

## Links

- [Original npm package](https://www.npmjs.com/package/websocket-as-promised)

---

**Built with ❤️ for the Elide Polyglot Runtime**
