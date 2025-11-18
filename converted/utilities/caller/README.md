# caller - Elide Polyglot Showcase

> **Get the caller of a function for ALL languages** - TypeScript, Python, Ruby, and Java

## Features

- Get caller file path
- Depth-based lookup
- Simple API
- **~40M downloads/week on npm**

## Quick Start

```typescript
import caller from './elide-caller.ts';

function myFunction() {
  const callerFile = caller(); // Get immediate caller
  const secondCaller = caller(1); // Get caller's caller

  console.log('Called from:', callerFile);
}
```

## Links

- [Original npm package](https://www.npmjs.com/package/caller)

---

**Built with ❤️ for the Elide Polyglot Runtime**
