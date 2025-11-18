# bayeux - Elide Polyglot Showcase

> **Bayeux protocol client for ALL languages** - TypeScript, Python, Ruby, and Java

## Features

- Bayeux 1.0 protocol
- HTTP long polling
- Channel subscriptions
- **~3K downloads/week on npm**

## Quick Start

```typescript
import BayeuxClient from './elide-bayeux.ts';

const client = new BayeuxClient('http://localhost:8080/bayeux');
await client.connect();
await client.subscribe('/chat', (data) => console.log(data));
await client.publish('/chat', { text: 'Hello!' });
```

## Links

- [Original npm package](https://www.npmjs.com/package/bayeux)

---

**Built with ❤️ for the Elide Polyglot Runtime**
