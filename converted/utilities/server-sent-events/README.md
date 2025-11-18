# server-sent-events - Elide Polyglot Showcase

> **SSE server implementation for ALL languages** - TypeScript, Python, Ruby, and Java

## Features

- SSE server implementation
- Event broadcasting
- Connection management
- **~10K downloads/week on npm**

## Quick Start

```typescript
import ServerSentEvents from './elide-server-sent-events.ts';

const sse = new ServerSentEvents();
const conn = sse.connect(req, res);
conn.send({ message: 'Hello!' }, 'notification');
```

## Links

- [Original npm package](https://www.npmjs.com/package/server-sent-events)

---

**Built with ❤️ for the Elide Polyglot Runtime**
