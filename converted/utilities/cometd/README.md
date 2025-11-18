# cometd - Elide Polyglot Showcase

> **Bayeux protocol client for ALL languages** - TypeScript, Python, Ruby, and Java

## Features

- Bayeux protocol support
- Long polling and WebSocket
- Pub/sub messaging
- **~5K downloads/week on npm**

## Quick Start

```typescript
import CometD from './elide-cometd.ts';

const cometd = new CometD();
cometd.configure({ url: 'http://localhost:8080/cometd' });
cometd.handshake(() => {
  cometd.subscribe('/chat', (msg) => console.log(msg));
  cometd.publish('/chat', { text: 'Hello!' });
});
```

## Links

- [Original npm package](https://www.npmjs.com/package/cometd)

---

**Built with ❤️ for the Elide Polyglot Runtime**
