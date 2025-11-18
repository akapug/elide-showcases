# websocket-driver - Elide Polyglot Showcase

> **WebSocket protocol implementation for ALL languages** - TypeScript, Python, Ruby, and Java

## Features

- RFC 6455 WebSocket protocol
- Frame parsing and serialization
- Handshake handling
- **~5M downloads/week on npm**

## Quick Start

```typescript
import Driver from './elide-websocket-driver.ts';

const driver = new Driver('ws://localhost:8080');
driver.start();
const frame = driver.text('Hello!');
```

## Links

- [Original npm package](https://www.npmjs.com/package/websocket-driver)

---

**Built with ❤️ for the Elide Polyglot Runtime**
