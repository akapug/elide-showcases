# jsmediatags - Elide Polyglot Showcase

> **Media tag reader for ALL languages** - TypeScript, Python, Ruby, and Java

## Features

- ID3v1 and ID3v2 tag reading
- MP4 metadata support
- Album art extraction
- Multiple file formats
- **~100K+ downloads/week on npm**

## Quick Start

```typescript
import { Reader, read } from './elide-jsmediatags.ts';

// Callback style
Reader.read('song.mp3', {
  onSuccess: (result) => {
    console.log(result.tags.title);
  }
});

// Promise style
const result = await read('song.mp3');
console.log(`${result.tags.title} by ${result.tags.artist}`);
```

## Links

- [Original npm package](https://www.npmjs.com/package/jsmediatags)

---

**Built with ❤️ for the Elide Polyglot Runtime**
