# centrifuge - Elide Polyglot Showcase

> **Centrifuge real-time client for ALL languages** - TypeScript, Python, Ruby, and Java

## Features

- Real-time subscriptions
- Pub/sub messaging
- Connection recovery
- **~10K downloads/week on npm**

## Quick Start

```typescript
import Centrifuge from './elide-centrifuge.ts';

const centrifuge = new Centrifuge('ws://localhost:8000/connection/websocket');
const sub = centrifuge.subscribe('news');
sub.on('publish', (ctx) => console.log(ctx.data));
```

## Links

- [Original npm package](https://www.npmjs.com/package/centrifuge)

---

**Built with ❤️ for the Elide Polyglot Runtime**
