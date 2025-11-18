# image-diff - Elide Polyglot Showcase

> **Image Difference Tool for ALL languages** - TypeScript, Python, Ruby, and Java

## Features

- Generate image diffs
- Highlight differences
- Multiple algorithms
- **~500K downloads/week on npm**

## Quick Start

```typescript
import imagediff from './elide-image-diff.ts';

const diff = await imageDiff({
  actualImage: 'actual.png',
  expectedImage: 'expected.png'
});
console.log('Difference:', diff.percentage);
```

## Links

- [Original npm package](https://www.npmjs.com/package/image-diff)

---

**Built with ❤️ for the Elide Polyglot Runtime**
