# Animated GIF Detector - Elide Polyglot Showcase

> **One GIF detector for ALL languages** - TypeScript, Python, Ruby, and Java

Detect if a GIF image is animated and count frames.

## Features

- Detect animated GIFs
- Fast detection
- Frame counting
- Buffer support
- **~10K downloads/week on npm**

## Quick Start

```typescript
import { isAnimated, getFrameCount } from './elide-animated-gif-detector.ts';

const buffer = fs.readFileSync('image.gif');
if (isAnimated(buffer)) {
  console.log(`Animated GIF with ${getFrameCount(buffer)} frames`);
}
```

## Links

- [Original npm package](https://www.npmjs.com/package/animated-gif-detector)

---

**Built with ❤️ for the Elide Polyglot Runtime**
