# imagemin - Elide Polyglot Showcase

> **Image Minification Library for ALL languages** - TypeScript, Python, Ruby, and Java

## Features

- Minify JPEG, PNG, GIF, SVG
- Plugin-based architecture
- Lossless and lossy compression
- **~8M downloads/week on npm**

## Quick Start

```typescript
import imagemin from './elide-imagemin.ts';

const files = imagemin(['images/*.png'], {
  plugins: [imageminPngquant({ quality: [0.6, 0.8] })]
});
console.log('Minified', files.length, 'images');
```

## Links

- [Original npm package](https://www.npmjs.com/package/imagemin)

---

**Built with ❤️ for the Elide Polyglot Runtime**
