# pusher - Elide Polyglot Showcase

> **Pusher real-time API for ALL languages** - TypeScript, Python, Ruby, and Java

## Features

- Real-time pub/sub
- Channel subscriptions
- Presence channels
- **~100K downloads/week on npm**

## Quick Start

```typescript
import Pusher from './elide-pusher.ts';

const pusher = new Pusher('app-key');
const channel = pusher.subscribe('my-channel');
channel.bind('my-event', (data) => console.log(data));
```

## Links

- [Original npm package](https://www.npmjs.com/package/pusher)

---

**Built with ❤️ for the Elide Polyglot Runtime**
