# polling - Elide Polyglot Showcase

> **Long polling for ALL languages** - TypeScript, Python, Ruby, and Java

## Features

- Long polling implementation
- Timeout handling
- Automatic retry
- **~50K downloads/week on npm**

## Quick Start

```typescript
import PollingClient from './elide-polling.ts';

const client = new PollingClient('http://localhost:3000/poll', {
  interval: 2000
});

client.start((data) => console.log('Received:', data));
```

## Links

- [Original npm package](https://www.npmjs.com/package/polling)

---

**Built with ❤️ for the Elide Polyglot Runtime**
