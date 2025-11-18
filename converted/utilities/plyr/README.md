# Plyr - Elide Polyglot Showcase

> **One simple media player for ALL languages** - TypeScript, Python, Ruby, and Java

Simple, lightweight, accessible HTML5 media player.

## Features

- HTML5 video/audio
- YouTube/Vimeo support
- Customizable controls
- Keyboard shortcuts
- Fullscreen support
- **~150K downloads/week on npm**

## Quick Start

```typescript
import Plyr from './elide-plyr.ts';

const player = new Plyr('video', {
  controls: ['play', 'progress', 'volume'],
  volume: 0.8
});

await player.play();
player.forward(10);
```

## Documentation

Run the demo:

```bash
elide run elide-plyr.ts
```

## Links

- [Original npm package](https://www.npmjs.com/package/plyr)
- [Plyr Documentation](https://plyr.io/)

---

**Built with ❤️ for the Elide Polyglot Runtime**
