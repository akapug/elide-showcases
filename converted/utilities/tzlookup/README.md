# tzlookup - Elide Polyglot Showcase

> **Timezone lookup by location for ALL languages** - TypeScript, Python, Ruby, and Java

## Features

- Find timezone from coordinates
- Geographic timezone detection
- **~300K downloads/week on npm**

## Quick Start

```typescript
import tzlookup from './elide-tzlookup.ts';

tzlookup(40.7, -74.0); // "America/New_York"
tzlookup(35.7, 139.7); // "Asia/Tokyo"
tzlookup.findTimezone({ lat: 51.5, lon: -0.1 }); // "Europe/London"
```

## Links

- [Original npm package](https://www.npmjs.com/package/tzlookup)

---

**Built with ❤️ for the Elide Polyglot Runtime**
