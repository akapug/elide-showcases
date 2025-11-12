# WebSocket - Elide Polyglot Showcase

> **One WebSocket library for ALL languages**

## Quick Start

```typescript
import { WebSocketServer } from './elide-ws.ts';

const wss = new WebSocketServer({ port: 8080 });

wss.on('connection', (ws) => {
  ws.on('message', (data) => {
    console.log('Received:', data);
  });
  ws.send('Hello!');
});
```

## Package Stats

- **npm downloads**: ~22M/week
- **Polyglot score**: 43/50 (A-Tier)

---

**Built with ❤️ for the Elide Polyglot Runtime**
