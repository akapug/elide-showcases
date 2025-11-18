# timezone - Elide Polyglot Showcase

> **Timezone conversion for ALL languages** - TypeScript, Python, Ruby, and Java

## Features

- Convert between timezones
- Get timezone offsets
- **~1M downloads/week on npm**

## Quick Start

```typescript
import timezone from './elide-timezone.ts';

const now = new Date();
timezone(now, 'UTC');
timezone(now, 'EST');
timezone.convert(now, 'UTC', 'EST');
timezone.offset('EST'); // -300
```

## Links

- [Original npm package](https://www.npmjs.com/package/timezone)

---

**Built with ❤️ for the Elide Polyglot Runtime**
