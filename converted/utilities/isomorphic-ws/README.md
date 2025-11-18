# isomorphic-ws - Elide Polyglot Showcase

> **Universal WebSocket client for ALL languages** - TypeScript, Python, Ruby, and Java

## Features

- Browser and Node.js compatible
- Standard WebSocket API
- SSR-friendly
- **~500K downloads/week on npm**

## Quick Start

```typescript
import WebSocket from './elide-isomorphic-ws.ts';

const ws = new WebSocket('ws://localhost:8080');
ws.onopen = () => ws.send('Hello!');
ws.onmessage = (event) => console.log(event.data);
```

## Links

- [Original npm package](https://www.npmjs.com/package/isomorphic-ws)

---

**Built with ❤️ for the Elide Polyglot Runtime**
