# VideoContext - Elide Polyglot Showcase

> **One video compositor for ALL languages** - TypeScript, Python, Ruby, and Java

Experimental WebGL video composition and processing framework.

## Features

- WebGL video processing
- Real-time effects
- Video composition
- Transitions and filters
- **~5K downloads/week on npm**

## Quick Start

```typescript
import VideoContext from './elide-videocontext.ts';

const ctx = new VideoContext(canvas);
const video = ctx.video('video.mp4');
const blur = ctx.effect('blur');
video.connect(blur);
ctx.play();
```

## Links

- [Original npm package](https://www.npmjs.com/package/videocontext)

---

**Built with ❤️ for the Elide Polyglot Runtime**
