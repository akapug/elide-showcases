# youch - Elide Polyglot Showcase

> **Pretty error reporting for ALL languages** - TypeScript, Python, Ruby, and Java

## Features

- Beautiful error pages
- Stack trace highlighting
- Code frame display
- **~1M downloads/week on npm**

## Quick Start

```typescript
import Youch from './elide-youch.ts';

const error = new Error("Something went wrong");
const youch = new Youch(error);

const html = youch.toHTML(); // Beautiful HTML error page
const json = youch.toJSON(); // JSON representation
```

## Links

- [Original npm package](https://www.npmjs.com/package/youch)

---

**Built with ❤️ for the Elide Polyglot Runtime**
