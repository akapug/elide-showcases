# duration - Elide Polyglot Showcase

> **Duration utilities for ALL languages** - TypeScript, Python, Ruby, and Java

## Features

- Create durations from various units
- Convert between units
- **~2M downloads/week on npm**

## Quick Start

```typescript
import Duration from './elide-duration.ts';

Duration.fromHours(2.5);
Duration.fromDays(1);
Duration.between(startDate, endDate);

const d = Duration.fromMinutes(90);
d.toHours(); // 1.5
d.toString(); // "1h 30m"
```

## Links

- [Original npm package](https://www.npmjs.com/package/duration)

---

**Built with ❤️ for the Elide Polyglot Runtime**
