# DOM to Image - Elide Polyglot Showcase

> **One dom-to-image for ALL languages** - TypeScript, Python, Ruby, and Java

Generate images from DOM nodes using HTML5 canvas.

## Features

- DOM to PNG conversion
- DOM to JPEG conversion
- DOM to SVG conversion
- Blob generation
- Data URL export
- **~2M downloads/week on npm**

## Quick Start

```typescript
import { DomToImage } from './elide-dom-to-image.ts';

const element = document.querySelector('#chart');

// Export as PNG
const pngDataUrl = await DomToImage.toPng(element);

// Export as JPEG
const jpegDataUrl = await DomToImage.toJpeg(element, {
  quality: 0.95,
  bgcolor: '#ffffff'
});

// Export as Blob
const blob = await DomToImage.toBlob(element);

// Export as SVG
const svgDataUrl = await DomToImage.toSvg(element);
```

## Links

- [Original npm package](https://www.npmjs.com/package/dom-to-image)

---

**Built with ❤️ for the Elide Polyglot Runtime**
