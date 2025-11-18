# Marko - Elide Polyglot Showcase

> **One template engine for ALL languages** - TypeScript, Python, Ruby, and Java

HTML re-imagined as a language with fast compilation and zero dependencies.

## Features

- Fast template compilation
- Template interpolation
- Conditional rendering
- Loop support
- Filters/helpers
- Zero dependencies
- **~1M downloads/week on npm**

## Quick Start

```typescript
import Marko from './elide-marko.ts';

const engine = new Marko();

const template = "Hello <%= name %>!";
console.log(engine.render(template, { name: "World" }));
```

## Documentation

Run the demo:

```bash
elide run elide-marko.ts
```

## Links

- [Original npm package](https://www.npmjs.com/package/marko)

---

**Built with ❤️ for the Elide Polyglot Runtime**
