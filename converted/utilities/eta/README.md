# Eta - Elide Polyglot Showcase

> **One template engine for ALL languages** - TypeScript, Python, Ruby, and Java

Embedded JS template engine with fast compilation and zero dependencies.

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
import Eta from './elide-eta.ts';

const engine = new Eta();

const template = "Hello <%= name %>!";
console.log(engine.render(template, { name: "World" }));
```

## Documentation

Run the demo:

```bash
elide run elide-eta.ts
```

## Links

- [Original npm package](https://www.npmjs.com/package/eta)

---

**Built with ❤️ for the Elide Polyglot Runtime**
