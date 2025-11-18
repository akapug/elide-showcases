# Dash.js - Elide Polyglot Showcase

> **One MPEG-DASH player for ALL languages** - TypeScript, Python, Ruby, and Java

Reference client implementation for MPEG-DASH adaptive streaming.

## Features

- MPEG-DASH playback
- Adaptive bitrate streaming
- Live/VOD support
- Quality level control
- Metrics tracking
- **~50K downloads/week on npm**

## Quick Start

```typescript
import DashPlayer from './elide-dash.js.ts';

const player = new DashPlayer();
player.initialize(videoElement, 'manifest.mpd', true);

// Manual quality control
player.setQualityFor('video', 2);
```

## Documentation

Run the demo:

```bash
elide run elide-dash.js.ts
```

## Links

- [Original npm package](https://www.npmjs.com/package/dashjs)
- [Dash.js Documentation](https://github.com/Dash-Industry-Forum/dash.js)

---

**Built with ❤️ for the Elide Polyglot Runtime**
