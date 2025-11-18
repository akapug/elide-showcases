# Video.js - Elide Polyglot Showcase

> **One HTML5 video player for ALL languages** - TypeScript, Python, Ruby, and Java

The world's most popular open source HTML5 video player.

## Features

- HTML5 video player
- Plugin architecture
- Customizable UI
- Multiple format support
- Responsive design
- Zero dependencies
- **~300K downloads/week on npm**

## Quick Start

```typescript
import videojs from './elide-videojs.ts';

const player = videojs('my-video', {
  controls: true,
  autoplay: false,
  fluid: true
});

player.src({ src: 'video.mp4', type: 'video/mp4' });
player.play();
```

## Documentation

Run the demo:

```bash
elide run elide-videojs.ts
```

## Links

- [Original npm package](https://www.npmjs.com/package/video.js)
- [Video.js Documentation](https://videojs.com/)

---

**Built with ❤️ for the Elide Polyglot Runtime**
