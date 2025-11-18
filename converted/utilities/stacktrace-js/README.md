# stacktrace-js - Elide Polyglot Showcase

> **Generate, parse, and enhance stack traces for ALL languages** - TypeScript, Python, Ruby, and Java

## Features

- Parse stack traces from any browser
- Source map support
- Stack frame normalization
- **~5M downloads/week on npm**

## Quick Start

```typescript
import StackTrace from './elide-stacktrace-js.ts';

// Get current stack
const frames = StackTrace.getSync();
console.log(frames);

// From an error
const error = new Error('Oops');
const errorFrames = StackTrace.fromError(error);
```

## Links

- [Original npm package](https://www.npmjs.com/package/stacktrace-js)

---

**Built with ❤️ for the Elide Polyglot Runtime**
