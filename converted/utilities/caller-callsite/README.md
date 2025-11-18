# caller-callsite - Elide Polyglot Showcase

> **Get callsite of the caller function for ALL languages** - TypeScript, Python, Ruby, and Java

## Features

- Get caller's callsite object
- Full stack frame access
- Depth support
- **~40M downloads/week on npm**

## Quick Start

```typescript
import callerCallsite from './elide-caller-callsite.ts';

function myFunction() {
  const callsite = callerCallsite();

  console.log(callsite.getFileName());
  console.log(callsite.getLineNumber());
  console.log(callsite.getFunctionName());
}
```

## Links

- [Original npm package](https://www.npmjs.com/package/caller-callsite)

---

**Built with ❤️ for the Elide Polyglot Runtime**
