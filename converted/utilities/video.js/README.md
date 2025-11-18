# Video.js Framework - Elide Polyglot Showcase

> **One video framework for ALL languages** - TypeScript, Python, Ruby, and Java

Powerful HTML5 video player with extensible plugin system.

## Features

- HTML5 video/audio player
- Plugin system
- Skin customization
- Event handling
- Mobile-friendly
- **~200K downloads/week on npm**

## Quick Start

```typescript
import VideoPlayer from './elide-video.js.ts';

const player = new VideoPlayer({
  controls: true,
  autoplay: false
});

player.load('video.mp4');
await player.play();
```

## Documentation

Run the demo:

```bash
elide run elide-video.js.ts
```

## Links

- [Original npm package](https://www.npmjs.com/package/video.js)

---

**Built with ❤️ for the Elide Polyglot Runtime**
