# reconnecting-websocket - Elide Polyglot Showcase

> **Auto-reconnecting WebSocket for ALL languages** - TypeScript, Python, Ruby, and Java

## Features

- Automatic reconnection
- Exponential backoff
- Manual reconnect control
- **~100K downloads/week on npm**

## Quick Start

```typescript
import ReconnectingWebSocket from './elide-reconnecting-websocket.ts';

const rws = new ReconnectingWebSocket('ws://localhost:8080');
rws.onopen = () => console.log('Connected');
```

## Links

- [Original npm package](https://www.npmjs.com/package/reconnecting-websocket)

---

**Built with ❤️ for the Elide Polyglot Runtime**
