# mqtt - Elide Polyglot Showcase

> **MQTT protocol for ALL languages** - TypeScript, Python, Ruby, and Java

## Features

- MQTT 3.1.1 and 5.0 support
- Publish/subscribe messaging
- QoS levels
- **~500K downloads/week on npm**

## Quick Start

```typescript
import { connect } from './elide-mqtt.ts';

const client = connect('mqtt://localhost:1883');
client.subscribe('topic', (msg) => console.log(msg));
client.publish('topic', 'Hello MQTT!');
```

## Links

- [Original npm package](https://www.npmjs.com/package/mqtt)

---

**Built with ❤️ for the Elide Polyglot Runtime**
