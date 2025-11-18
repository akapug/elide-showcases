# OpenLayers - Elide Polyglot Showcase

> **One web mapping library for ALL languages** - TypeScript, Python, Ruby, and Java

High-performance mapping library for web GIS applications.

## Features

- Multiple map layers
- Vector and raster data
- Projection support
- Interactive controls
- **~200K+ downloads/week on npm**

## Quick Start

```typescript
import { Map, View } from './elide-openlayers.ts';

const map = new Map({
  target: 'map',
  view: new View({
    center: [0, 0],
    zoom: 2
  })
});
```

## Documentation

Run the demo:

```bash
elide run elide-openlayers.ts
```

---

**Built with ❤️ for the Elide Polyglot Runtime**
