# stack-trace - Elide Polyglot Showcase

> **Get v8 stack traces as an array of CallSite objects for ALL languages** - TypeScript, Python, Ruby, and Java

## Features

- Parse V8 stack traces
- Access CallSite objects
- Extract file, line, column info
- **~15M downloads/week on npm**

## Quick Start

```typescript
import stackTrace from './elide-stack-trace.ts';

const error = new Error('Oops');
const callSites = stackTrace.parse(error);

callSites.forEach(site => {
  console.log(site.getFileName(), site.getLineNumber());
});
```

## Links

- [Original npm package](https://www.npmjs.com/package/stack-trace)

---

**Built with ❤️ for the Elide Polyglot Runtime**
