# dot - Elide Polyglot Showcase

> **One fast template engine for ALL languages** - TypeScript, Python, Ruby, and Java

Blazingly fast template engine with simple syntax and zero dependencies.

## Features

- Ultra-fast template compilation
- Simple syntax with {{= }} for interpolation
- Conditional and loop support
- Partials and includes
- Zero runtime dependencies
- **~5M downloads/week on npm**

## Quick Start

```typescript
import DotTemplate from './elide-dot.ts';

const dot = new DotTemplate();

const template = "Hello {{=it.name}}!";
const output = dot.render(template, { name: "World" });

console.log(output); // Hello World!
```

## Documentation

Run the demo:

```bash
elide run elide-dot.ts
```

## Links

- [Original npm package](https://www.npmjs.com/package/dot)

---

**Built with ❤️ for the Elide Polyglot Runtime**
