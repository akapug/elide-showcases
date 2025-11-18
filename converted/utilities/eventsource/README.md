# eventsource - Elide Polyglot Showcase

> **Server-Sent Events client for ALL languages** - TypeScript, Python, Ruby, and Java

## Features

- Server-Sent Events support
- Auto-reconnection
- Custom events
- **~2M downloads/week on npm**

## Quick Start

```typescript
import EventSource from './elide-eventsource.ts';

const es = new EventSource('http://localhost:3000/events');
es.onmessage = (event) => console.log(event.data);
```

## Links

- [Original npm package](https://www.npmjs.com/package/eventsource)

---

**Built with ❤️ for the Elide Polyglot Runtime**
