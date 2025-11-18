# faye - Elide Polyglot Showcase

> **Pub/sub messaging for ALL languages** - TypeScript, Python, Ruby, and Java

## Features

- Bayeux protocol
- Pub/sub messaging
- Channel subscriptions
- **~50K downloads/week on npm**

## Quick Start

```typescript
import { Client } from './elide-faye.ts';

const client = new Client('http://localhost:8000/faye');
client.connect();

client.subscribe('/messages', (msg) => console.log(msg));
client.publish('/messages', { text: 'Hello!' });
```

## Links

- [Original npm package](https://www.npmjs.com/package/faye)

---

**Built with ❤️ for the Elide Polyglot Runtime**
