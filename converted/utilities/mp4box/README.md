# MP4Box - Elide Polyglot Showcase

> **One MP4 manipulation tool for ALL languages** - TypeScript, Python, Ruby, and Java

JavaScript library for MP4 file parsing and manipulation.

## Features

- MP4 parsing and creation
- Fragmentation support
- Track extraction
- MSE integration
- **~30K downloads/week on npm**

## Quick Start

```typescript
import MP4Box from './elide-mp4box.ts';

const mp4box = new MP4Box();
mp4box.onReady = (info) => console.log(info);
mp4box.appendBuffer(buffer);
```

## Links

- [Original npm package](https://www.npmjs.com/package/mp4box)

---

**Built with ❤️ for the Elide Polyglot Runtime**
