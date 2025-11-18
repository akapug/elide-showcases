# phoenix - Elide Polyglot Showcase

> **Phoenix Channels client for ALL languages** - TypeScript, Python, Ruby, and Java

## Features

- Phoenix Channels support
- Real-time bidirectional communication
- Presence tracking
- **~30K downloads/week on npm**

## Quick Start

```typescript
import { Socket } from './elide-phoenix.ts';

const socket = new Socket('ws://localhost:4000/socket');
socket.connect();

const channel = socket.channel('room:lobby', {});
channel.join().receive('ok', (resp) => console.log('Joined!'));
```

## Links

- [Original npm package](https://www.npmjs.com/package/phoenix)

---

**Built with ❤️ for the Elide Polyglot Runtime**
