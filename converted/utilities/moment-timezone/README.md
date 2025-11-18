# moment-timezone - Elide Polyglot Showcase

> **Timezone support for ALL languages** - TypeScript, Python, Ruby, and Java

## Features

- Convert dates between timezones
- Timezone database
- **~15M downloads/week on npm**

## Quick Start

```typescript
import momentTz from './elide-moment-timezone.ts';

const now = new Date();
momentTz(now).tz('America/New_York').format();
momentTz(now).tz('Asia/Tokyo').format();
momentTz.tz.names(); // List all timezones
```

## Links

- [Original npm package](https://www.npmjs.com/package/moment-timezone)

---

**Built with ❤️ for the Elide Polyglot Runtime**
