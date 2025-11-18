# pusher-js - Elide Polyglot Showcase

> **Pusher JavaScript client for ALL languages** - TypeScript, Python, Ruby, and Java

## Features

- Real-time pub/sub
- Channel subscriptions
- Presence channels
- **~80K downloads/week on npm**

## Quick Start

```typescript
import Pusher from './elide-pusher-js.ts';

const pusher = new Pusher('app-key', { cluster: 'us2' });
const channel = pusher.subscribe('my-channel');
channel.bind('my-event', (data) => console.log(data));
```

## Links

- [Original npm package](https://www.npmjs.com/package/pusher-js)

---

**Built with ❤️ for the Elide Polyglot Runtime**
