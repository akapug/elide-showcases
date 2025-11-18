# caller-path - Elide Polyglot Showcase

> **Get the path of the caller module for ALL languages** - TypeScript, Python, Ruby, and Java

## Features

- Get caller's file path
- Clean path output
- Depth support
- **~40M downloads/week on npm**

## Quick Start

```typescript
import callerPath from './elide-caller-path.ts';

function myFunction() {
  const path = callerPath(); // Immediate caller's path
  const secondPath = callerPath(1); // Caller's caller path

  console.log('Called from:', path);
}
```

## Links

- [Original npm package](https://www.npmjs.com/package/caller-path)

---

**Built with ❤️ for the Elide Polyglot Runtime**
