# pubnub - Elide Polyglot Showcase

> **PubNub real-time network for ALL languages** - TypeScript, Python, Ruby, and Java

## Features

- Real-time pub/sub
- Presence detection
- Message persistence
- **~80K downloads/week on npm**

## Quick Start

```typescript
import PubNub from './elide-pubnub.ts';

const pubnub = new PubNub({ publishKey: 'pub-key', subscribeKey: 'sub-key' });
pubnub.subscribe({ channels: ['my-channel'] });
pubnub.publish({ channel: 'my-channel', message: { text: 'Hello!' } });
```

## Links

- [Original npm package](https://www.npmjs.com/package/pubnub)

---

**Built with ❤️ for the Elide Polyglot Runtime**
