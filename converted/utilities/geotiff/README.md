# GeoTIFF - Elide Polyglot Showcase

> **One GeoTIFF parser for ALL languages** - TypeScript, Python, Ruby, and Java

Read and parse GeoTIFF raster files.

## Quick Start

```typescript
import { fromArrayBuffer } from './elide-geotiff.ts';

const tiff = await fromArrayBuffer(buffer);
const image = await tiff.getImage();
console.log(image.getWidth(), image.getHeight());
```

---

**Built with ❤️ for the Elide Polyglot Runtime**
