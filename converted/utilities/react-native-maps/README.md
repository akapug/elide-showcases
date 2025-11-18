# React Native Maps - Elide Polyglot Showcase

> **One map library for ALL languages** - TypeScript, Python, Ruby, and Java

Map components for React Native using native maps.

## Features

- Native maps (Google Maps, Apple Maps)
- Markers and overlays
- Regions and coordinates
- Clustering
- Custom map styles
- **~1M downloads/week on npm**

## Quick Start

```typescript
import { MapView, Marker } from './elide-react-native-maps.ts';

const map = new MapView({
  region: { latitude: 37.78825, longitude: -122.4324, latitudeDelta: 0.0922, longitudeDelta: 0.0421 },
});

const marker = new Marker({
  coordinate: { latitude: 37.78825, longitude: -122.4324 },
  title: 'San Francisco',
});
```

## Documentation

Run the demo:

```bash
elide run elide-react-native-maps.ts
```

## Links

- [Original npm package](https://www.npmjs.com/package/react-native-maps)

---

**Built with ❤️ for the Elide Polyglot Runtime**
