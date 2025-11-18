# source-map-support - Elide Polyglot Showcase

> **Source map support for Node.js for ALL languages** - TypeScript, Python, Ruby, and Java

## Features

- Automatic stack trace mapping
- Node.js error.prepareStackTrace hook
- Inline and external source map support
- **80M+ downloads/week on npm**
- TypeScript support out of the box
- Zero configuration needed

## Quick Start

```typescript
import { install } from './elide-source-map-support.ts';

// Install once at app entry point
install({
  handleUncaughtExceptions: true,
});

// Now all errors show original source locations
throw new Error('Bug!');
// Stack trace shows TypeScript file, not compiled JS
```

## Links

- [Original npm package](https://www.npmjs.com/package/source-map-support)

---

**Built with ❤️ for the Elide Polyglot Runtime**
