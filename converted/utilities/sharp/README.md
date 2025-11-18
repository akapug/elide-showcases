# sharp - Elide Polyglot Showcase

> **High-Performance Image Processing for ALL languages** - TypeScript, Python, Ruby, and Java

## Features

- Resize, rotate, blur, sharpen images
- Convert between JPEG, PNG, WebP, AVIF
- Fastest Node.js image processing library
- **~15M downloads/week on npm**

## Quick Start

```typescript
import sharp from './elide-sharp.ts';

const pipeline = sharp('input.jpg')
  .resize(800, 600)
  .rotate(90)
  .jpeg({ quality: 90 });

pipeline.toFile('output.jpg').then(info => {
  console.log('Output:', info);
});
```

## Links

- [Original npm package](https://www.npmjs.com/package/sharp)

---

**Built with ❤️ for the Elide Polyglot Runtime**
