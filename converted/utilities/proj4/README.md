# Proj4 - Elide Polyglot Showcase

> **One coordinate transformation library for ALL languages** - TypeScript, Python, Ruby, and Java

Transform coordinates between different projections including WGS84 and Web Mercator.

## Features

- WGS84 (EPSG:4326) support
- Web Mercator (EPSG:3857)
- Forward and inverse transformations
- UTM zone calculation
- Custom projection definitions
- Zero dependencies
- **~500K+ downloads/week on npm**

## Quick Start

```typescript
import { proj4, toMercator, fromMercator } from './elide-proj4.ts';

// WGS84 to Web Mercator
const mercator = proj4('EPSG:4326', 'EPSG:3857', [-74.006, 40.7128]);

// Or use helper functions
const merc = toMercator(-74.006, 40.7128);
const wgs84 = fromMercator(merc[0], merc[1]);
```

## Documentation

Run the demo:

```bash
elide run elide-proj4.ts
```

## Links

- [Original npm package](https://www.npmjs.com/package/proj4)
- [Proj4 Documentation](https://proj4.org/)

---

**Built with ❤️ for the Elide Polyglot Runtime**
