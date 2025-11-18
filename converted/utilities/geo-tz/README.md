# geo-tz - Elide Polyglot Showcase

> **Geographic timezone lookup for ALL languages** - TypeScript, Python, Ruby, and Java

## Features

- Find timezone from geographic coordinates
- High-accuracy timezone detection
- **~500K downloads/week on npm**

## Quick Start

```typescript
import geoTz from './elide-geo-tz.ts';

geoTz(40.7, -74.0); // ["America/New_York"]
geoTz.find(35.7, 139.7); // ["Asia/Tokyo"]
geoTz.findFromCoords({ lat: 51.5, lng: -0.1 }); // ["Europe/London"]
```

## Links

- [Original npm package](https://www.npmjs.com/package/geo-tz)

---

**Built with ❤️ for the Elide Polyglot Runtime**
