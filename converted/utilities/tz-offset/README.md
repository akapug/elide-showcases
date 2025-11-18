# tz-offset - Elide Polyglot Showcase

> **Timezone offset calculator for ALL languages** - TypeScript, Python, Ruby, and Java

## Features

- Get timezone offsets
- Convert between units
- **~500K downloads/week on npm**

## Quick Start

```typescript
import tzOffset from './elide-tz-offset.ts';

tzOffset('EST'); // -300 minutes
tzOffset.getOffset('JST', 'hours'); // 9 hours
tzOffset.fromDate(new Date());
tzOffset.toISO(-300); // "-05:00"
```

## Links

- [Original npm package](https://www.npmjs.com/package/tz-offset)

---

**Built with ❤️ for the Elide Polyglot Runtime**
