# Leaflet - Elide Polyglot Showcase

> **One interactive mapping library for ALL languages** - TypeScript, Python, Ruby, and Java

Leading library for mobile-friendly interactive maps with markers, popups, and vector layers.

## Features

- Interactive panning and zooming
- Marker and popup support
- Vector layers (circles, polygons, polylines)
- GeoJSON layer support
- Map bounds and fitting
- Zero dependencies
- **~1M+ downloads/week on npm**

## Quick Start

```typescript
import { Map, latLng, marker } from './elide-leaflet.ts';

const map = new Map(latLng(51.505, -0.09), 13);

map.addMarker(marker(latLng(51.5, -0.09), {
  title: "Hello World!",
  popup: "Welcome to Leaflet on Elide"
}));

console.log("Map bounds:", map.getBounds());
```

## Documentation

Run the demo:

```bash
elide run elide-leaflet.ts
```

## Links

- [Original npm package](https://www.npmjs.com/package/leaflet)
- [Leaflet Documentation](https://leafletjs.com/)

---

**Built with ❤️ for the Elide Polyglot Runtime**
