# pretty-error - Elide Polyglot Showcase

> **Beautiful errors in Node for ALL languages** - TypeScript, Python, Ruby, and Java

## Features

- Colored stack traces
- Skip internal frames
- Customizable rendering
- **~3M downloads/week on npm**

## Quick Start

```typescript
import PrettyError from './elide-pretty-error.ts';

const pe = new PrettyError();
pe.start();

try {
  throw new Error("Oops!");
} catch (error) {
  console.log(pe.render(error));
}
```

## Links

- [Original npm package](https://www.npmjs.com/package/pretty-error)

---

**Built with ❤️ for the Elide Polyglot Runtime**
