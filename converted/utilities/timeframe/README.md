# timeframe - Elide Polyglot Showcase

> **Time frame utilities for ALL languages** - TypeScript, Python, Ruby, and Java

## Features

- Create and manipulate time frames
- Check overlaps and intersections
- **~100K downloads/week on npm**

## Quick Start

```typescript
import timeframe from './elide-timeframe.ts';

const tf = timeframe.create(startDate, endDate);
timeframe.contains(tf, date);
timeframe.overlaps(tf1, tf2);
timeframe.duration(tf);
timeframe.intersection(tf1, tf2);
```

## Links

- [Original npm package](https://www.npmjs.com/package/timeframe)

---

**Built with ❤️ for the Elide Polyglot Runtime**
