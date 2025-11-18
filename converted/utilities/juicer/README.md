# Juicer - Elide Polyglot Showcase

> **One template engine for ALL languages** - TypeScript, Python, Ruby, and Java

Lightweight template engine with fast compilation and zero dependencies.

## Features

- Fast template compilation
- Template interpolation
- Conditional rendering
- Loop support
- Filters/helpers
- Zero dependencies
- **~200K downloads/week on npm**

## Quick Start

```typescript
import Juicer from './elide-juicer.ts';

const engine = new Juicer();

const template = "Hello <%= name %>!";
console.log(engine.render(template, { name: "World" }));
```

## Documentation

Run the demo:

```bash
elide run elide-juicer.ts
```

## Links

- [Original npm package](https://www.npmjs.com/package/juicer)

---

**Built with ❤️ for the Elide Polyglot Runtime**
