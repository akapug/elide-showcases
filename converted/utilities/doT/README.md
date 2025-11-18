# doT - Elide Polyglot Showcase

> **The fastest template engine for ALL languages** - TypeScript, Python, Ruby, and Java

The fastest and most concise JavaScript template engine for Node.js and browsers.

## Features

- Fastest template compilation and evaluation
- Custom delimiters
- Runtime and compile-time evaluation
- Partials support
- Conditional compilation
- Array iteration
- **~3M downloads/week on npm**

## Quick Start

```typescript
import DoT from './elide-doT.ts';

const dot = new DoT();
const tmpl = dot.compile("Hello {{=it.name}}!");

console.log(tmpl({ name: "World" })); // Hello World!
```

## Documentation

Run the demo:

```bash
elide run elide-doT.ts
```

## Links

- [Original npm package](https://www.npmjs.com/package/dot)

---

**Built with ❤️ for the Elide Polyglot Runtime**
