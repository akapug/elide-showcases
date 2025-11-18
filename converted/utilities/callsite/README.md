# callsite - Elide Polyglot Showcase

> **Access v8 CallSite objects for ALL languages** - TypeScript, Python, Ruby, and Java

## Features

- Get call site information
- Access caller details
- V8 stack API wrapper
- **~8M downloads/week on npm**

## Quick Start

```typescript
import callsite from './elide-callsite.ts';

function myFunction() {
  const stack = callsite();
  const caller = stack[0];

  console.log(caller.getFileName());
  console.log(caller.getLineNumber());
}
```

## Links

- [Original npm package](https://www.npmjs.com/package/callsite)

---

**Built with ❤️ for the Elide Polyglot Runtime**
