# Google Maps - Elide Polyglot Showcase

> **One Google Maps library for ALL languages** - TypeScript, Python, Ruby, and Java

Google Maps API integration for mapping applications.

## Features

- Map initialization
- Markers and info windows
- Geocoding
- Places API
- **~200K+ downloads/week on npm**

## Quick Start

```typescript
import { Map, Marker } from './elide-google-maps.ts';

const map = new Map(null, {
  center: { lat: 40.7128, lng: -74.0060 },
  zoom: 12
});

const marker = new Marker({
  position: { lat: 40.7128, lng: -74.0060 },
  map
});
```

## Documentation

Run the demo:

```bash
elide run elide-google-maps.ts
```

---

**Built with ❤️ for the Elide Polyglot Runtime**
