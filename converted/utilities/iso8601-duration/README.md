# iso8601-duration - Elide Polyglot Showcase

> **ISO 8601 duration parsing for ALL languages** - TypeScript, Python, Ruby, and Java

## Features

- Parse ISO 8601 duration strings
- Convert to seconds
- **~3M downloads/week on npm**

## Quick Start

```typescript
import iso8601Duration from './elide-iso8601-duration.ts';

iso8601Duration.parse('P1Y2M3D'); // { years: 1, months: 2, days: 3 }
iso8601Duration.parse('PT2H30M'); // { hours: 2, minutes: 30 }
iso8601Duration.toSeconds({ hours: 2, minutes: 30 }); // 9000
iso8601Duration.end('P1D', new Date()); // Date 1 day from now
```

## Links

- [Original npm package](https://www.npmjs.com/package/iso8601-duration)

---

**Built with ❤️ for the Elide Polyglot Runtime**
