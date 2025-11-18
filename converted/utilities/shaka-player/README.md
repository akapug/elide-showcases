# Shaka Player - Elide Polyglot Showcase

> **One advanced streaming player for ALL languages** - TypeScript, Python, Ruby, and Java

JavaScript library for adaptive media streaming with DRM support.

## Features

- DASH and HLS support
- DRM (Widevine, PlayReady, FairPlay)
- Offline storage
- Advanced buffering
- Track selection
- **~80K downloads/week on npm**

## Quick Start

```typescript
import ShakaPlayer from './elide-shaka-player.ts';

const player = new ShakaPlayer(videoElement);
await player.load('manifest.mpd');

// Select quality
const tracks = player.getVariantTracks();
player.selectVariantTrack(tracks[1]);
```

## Documentation

Run the demo:

```bash
elide run elide-shaka-player.ts
```

## Links

- [Original npm package](https://www.npmjs.com/package/shaka-player)
- [Shaka Player Documentation](https://shaka-player-demo.appspot.com/)

---

**Built with ❤️ for the Elide Polyglot Runtime**
