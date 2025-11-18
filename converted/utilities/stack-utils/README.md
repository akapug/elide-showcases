# stack-utils - Elide Polyglot Showcase

> **Capture and manipulate stack traces for ALL languages** - TypeScript, Python, Ruby, and Java

## Features

- Parse stack traces
- Clean internal frames
- Capture call sites
- **~40M downloads/week on npm**

## Quick Start

```typescript
import StackUtils from './elide-stack-utils.ts';

const stackUtils = new StackUtils();

const error = new Error('Oops');
const cleaned = stackUtils.clean(error.stack);

const callSites = stackUtils.capture(5);
console.log(callSites);
```

## Links

- [Original npm package](https://www.npmjs.com/package/stack-utils)

---

**Built with ❤️ for the Elide Polyglot Runtime**
