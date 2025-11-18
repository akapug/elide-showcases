# node-id3 - Elide Polyglot Showcase

> **ID3 tag editor for ALL languages** - TypeScript, Python, Ruby, and Java

## Features

- Read and write ID3 tags
- Album artwork support
- ID3v1 and ID3v2 support
- Comment and lyrics support
- **~50K+ downloads/week on npm**

## Quick Start

```typescript
import { read, write, update } from './elide-node-id3.ts';

// Read tags
const tags = read('song.mp3');
console.log(tags.title);

// Write tags
write({
  title: 'My Song',
  artist: 'My Artist',
  album: 'My Album'
}, 'output.mp3');

// Update tags
update({ title: 'New Title' }, 'song.mp3');
```

## Links

- [Original npm package](https://www.npmjs.com/package/node-id3)

---

**Built with ❤️ for the Elide Polyglot Runtime**
