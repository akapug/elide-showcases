# sse-channel - Elide Polyglot Showcase

> **SSE channel management for ALL languages** - TypeScript, Python, Ruby, and Java

## Features

- SSE channel management
- Client subscription
- Broadcasting
- **~5K downloads/week on npm**

## Quick Start

```typescript
import SseChannel from './elide-sse-channel.ts';

const channel = new SseChannel({ history: 10 });
channel.addClient(req, res);
channel.send({ message: 'Hello!' }, 'notification');
```

## Links

- [Original npm package](https://www.npmjs.com/package/sse-channel)

---

**Built with ❤️ for the Elide Polyglot Runtime**
