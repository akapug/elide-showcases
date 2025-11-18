# timeago.js - Elide Polyglot Showcase

> **Relative time formatting for ALL languages** - TypeScript, Python, Ruby, and Java

## Features

- Format dates as "5 minutes ago", "3 days ago", etc.
- Lightweight and simple
- **~1M downloads/week on npm**

## Quick Start

```typescript
import timeago from './elide-timeago.js.ts';

timeago.format(new Date(Date.now() - 5 * 60 * 1000)); // "5 minutes ago"
timeago.format(new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)); // "3 days ago"
```

## Links

- [Original npm package](https://www.npmjs.com/package/timeago.js)

---

**Built with ❤️ for the Elide Polyglot Runtime**
