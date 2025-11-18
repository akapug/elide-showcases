# GIF Encoder - Elide Polyglot Showcase

> **One GIF creator for ALL languages** - TypeScript, Python, Ruby, and Java

Create animated GIFs from video frames or image sequences.

## Features

- Animated GIF creation
- Frame-by-frame encoding
- Quality control
- Delay and loop settings
- Color quantization
- **~30K downloads/week on npm**

## Quick Start

```typescript
import GifEncoder from './elide-gif-encoder.ts';

const encoder = new GifEncoder(320, 240);
encoder.setDelay(100);
encoder.start();

// Add frames
encoder.addFrame(frameBuffer);
encoder.finish();

const gif = encoder.out();
```

## Documentation

Run the demo:

```bash
elide run elide-gif-encoder.ts
```

## Links

- [Original npm package](https://www.npmjs.com/package/gif-encoder)

---

**Built with ❤️ for the Elide Polyglot Runtime**
