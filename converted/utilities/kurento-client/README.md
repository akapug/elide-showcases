# Kurento Client - Elide Polyglot Showcase

> **One Kurento client for ALL languages** - TypeScript, Python, Ruby, and Java

Client library for Kurento Media Server.

## Features

- Kurento Media Server client
- WebRTC processing
- Media pipelines
- Recording/playback
- **~10K downloads/week on npm**

## Quick Start

```typescript
import { connect } from './elide-kurento-client.ts';

const client = await connect('ws://localhost:8888/kurento');
const pipeline = await client.create('MediaPipeline');
```

## Links

- [Original npm package](https://www.npmjs.com/package/kurento-client)

---

**Built with ❤️ for the Elide Polyglot Runtime**
