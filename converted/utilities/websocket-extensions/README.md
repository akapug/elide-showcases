# websocket-extensions - Elide Polyglot Showcase

> **WebSocket extension framework for ALL languages** - TypeScript, Python, Ruby, and Java

## Features

- Extension negotiation
- Per-message compression
- Custom extension support
- **~5M downloads/week on npm**

## Quick Start

```typescript
import Extensions from './elide-websocket-extensions.ts';

const ext = new Extensions();
ext.register({ name: 'permessage-deflate', type: 'permessage', rsv1: true });
const offer = ext.generateOffer();
```

## Links

- [Original npm package](https://www.npmjs.com/package/websocket-extensions)

---

**Built with ❤️ for the Elide Polyglot Runtime**
