# jimp - Elide Polyglot Showcase

> **Pure JavaScript Image Processing for ALL languages** - TypeScript, Python, Ruby, and Java

## Features

- No native dependencies
- Resize, crop, rotate, blur
- Add text, shapes, effects
- **~8M downloads/week on npm**

## Quick Start

```typescript
import jimp from './elide-jimp.ts';

const image = new Jimp(800, 600, 0xFFFFFFFF);
image.resize(400, 300)
     .blur(2)
     .quality(90);
console.log('Image:', image.getWidth(), 'x', image.getHeight());
```

## Links

- [Original npm package](https://www.npmjs.com/package/jimp)

---

**Built with ❤️ for the Elide Polyglot Runtime**
