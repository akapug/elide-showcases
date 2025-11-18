# Wellknown - Elide Polyglot Showcase

> **One WKT parser for ALL languages** - TypeScript, Python, Ruby, and Java

Convert between WKT (Well-Known Text) and GeoJSON for GIS integration.

## Features

- Parse WKT to GeoJSON
- Stringify GeoJSON to WKT
- Point, LineString, Polygon support
- Zero dependencies
- **~50K+ downloads/week on npm**

## Quick Start

```typescript
import { parse, stringify } from './elide-wellknown.ts';

const geom = parse("POINT(-74.006 40.7128)");
const wkt = stringify({ type: 'Point', coordinates: [-74.006, 40.7128] });
```

## Documentation

Run the demo:

```bash
elide run elide-wellknown.ts
```

## Links

- [Original npm package](https://www.npmjs.com/package/wellknown)

---

**Built with ❤️ for the Elide Polyglot Runtime**
