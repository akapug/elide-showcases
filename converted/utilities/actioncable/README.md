# actioncable - Elide Polyglot Showcase

> **Rails ActionCable client for ALL languages** - TypeScript, Python, Ruby, and Java

## Features

- Rails ActionCable integration
- WebSocket connections
- Channel subscriptions
- **~10K downloads/week on npm**

## Quick Start

```typescript
import { createConsumer } from './elide-actioncable.ts';

const consumer = createConsumer('ws://localhost:3000/cable');
const sub = consumer.subscriptions.create({ channel: 'ChatChannel' }, {
  received: (data) => console.log(data)
});
```

## Links

- [Original npm package](https://www.npmjs.com/package/actioncable)

---

**Built with ❤️ for the Elide Polyglot Runtime**
