# GeoJSON Extent - Elide Polyglot Showcase

> **One bounding box calculator for ALL languages** - TypeScript, Python, Ruby, and Java

Calculate bounding boxes for GeoJSON objects.

## Features

- Calculate bbox [minX, minY, maxX, maxY]
- Support all geometry types
- **~30K+ downloads/week on npm**

## Quick Start

```typescript
import extent from './elide-geojson-extent.ts';

const bbox = extent({ type: 'Point', coordinates: [-74.006, 40.7128] });
console.log(bbox); // [minLng, minLat, maxLng, maxLat]
```

---

**Built with ❤️ for the Elide Polyglot Runtime**
