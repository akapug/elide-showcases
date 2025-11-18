# longjohn - Elide Polyglot Showcase

> **Long stack traces for Node.js for ALL languages** - TypeScript, Python, Ruby, and Java

## Features

- Async stack trace tracking
- Cross-async boundary traces
- Error context preservation
- **~1M downloads/week on npm**

## Quick Start

```typescript
import longjohn from './elide-longjohn.ts';

longjohn.install();

// Now all errors will have extended async stack traces
async function myFunction() {
  throw new Error('Something went wrong');
}
```

## Links

- [Original npm package](https://www.npmjs.com/package/longjohn)

---

**Built with ❤️ for the Elide Polyglot Runtime**
