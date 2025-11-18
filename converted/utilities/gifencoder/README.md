# GIFEncoder - Elide Polyglot Showcase

> **One streaming GIF encoder for ALL languages** - TypeScript, Python, Ruby, and Java

Streaming GIF encoder for creating animated GIFs.

## Features

- Streaming GIF encoding
- Frame-by-frame processing
- Quality control
- Transparency support
- **~20K downloads/week on npm**

## Quick Start

```typescript
import GIFEncoder from './elide-gifencoder.ts';

const encoder = new GIFEncoder(320, 240);
encoder.setDelay(100);
encoder.start();
encoder.addFrame(canvas);
encoder.finish();
```

## Links

- [Original npm package](https://www.npmjs.com/package/gifencoder)

---

**Built with ❤️ for the Elide Polyglot Runtime**
