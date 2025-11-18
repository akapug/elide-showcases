# Mapbox GL - Elide Polyglot Showcase

> **One vector mapping library for ALL languages** - TypeScript, Python, Ruby, and Java

Interactive WebGL-powered vector maps with custom styling.

## Features

- Vector tile rendering
- Custom map styles
- Markers and popups
- Interactive controls
- **~500K+ downloads/week on npm**

## Quick Start

```typescript
import { Map, Marker } from './elide-mapbox-gl.ts';

const map = new Map({
  container: 'map',
  style: 'mapbox://styles/mapbox/streets-v11',
  center: [-74.006, 40.7128],
  zoom: 12
});

new Marker().setLngLat([-74.006, 40.7128]).addTo(map);
```

## Documentation

Run the demo:

```bash
elide run elide-mapbox-gl.ts
```

---

**Built with ❤️ for the Elide Polyglot Runtime**
