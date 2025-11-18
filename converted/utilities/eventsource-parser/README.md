# eventsource-parser - Elide Polyglot Showcase

> **SSE stream parser for ALL languages** - TypeScript, Python, Ruby, and Java

## Features

- Parse SSE streams
- Event extraction
- Data field parsing
- **~100K downloads/week on npm**

## Quick Start

```typescript
import { createParser } from './elide-eventsource-parser.ts';

const parser = createParser((event) => {
  console.log('Parsed:', event);
});

parser.feed('data: Hello\n\n');
```

## Links

- [Original npm package](https://www.npmjs.com/package/eventsource-parser)

---

**Built with ❤️ for the Elide Polyglot Runtime**
