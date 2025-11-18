# Art Template - Elide Polyglot Showcase

> **One template engine for ALL languages** - TypeScript, Python, Ruby, and Java

High performance template engine with fast compilation and zero dependencies.

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
import Art Template from './elide-art-template.ts';

const engine = new Art Template();

const template = "Hello <%= name %>!";
console.log(engine.render(template, { name: "World" }));
```

## Documentation

Run the demo:

```bash
elide run elide-art-template.ts
```

## Links

- [Original npm package](https://www.npmjs.com/package/art-template)

---

**Built with ❤️ for the Elide Polyglot Runtime**
