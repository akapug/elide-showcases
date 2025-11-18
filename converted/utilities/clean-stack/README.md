# clean-stack - Elide Polyglot Showcase

> **Clean up error stack traces for ALL languages** - TypeScript, Python, Ruby, and Java

## Features

- Remove internal Node.js entries
- Simplify file paths
- Configurable filtering
- **~15M downloads/week on npm**

## Quick Start

```typescript
import cleanStack from './elide-clean-stack.ts';

const error = new Error('Oops!');
const cleaned = cleanStack(error.stack, { pretty: true });

console.log(cleaned); // Much cleaner!
```

## Links

- [Original npm package](https://www.npmjs.com/package/clean-stack)

---

**Built with ❤️ for the Elide Polyglot Runtime**
