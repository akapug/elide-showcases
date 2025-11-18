# VelocityJS - Elide Polyglot Showcase

> **One template engine for ALL languages** - TypeScript, Python, Ruby, and Java

Velocity template engine for JavaScript with fast compilation and zero dependencies.

## Features

- Fast template compilation
- Template interpolation
- Conditional rendering
- Loop support
- Filters/helpers
- Zero dependencies
- **~500K downloads/week on npm**

## Quick Start

```typescript
import VelocityJS from './elide-velocityjs.ts';

const engine = new VelocityJS();

const template = "Hello <%= name %>!";
console.log(engine.render(template, { name: "World" }));
```

## Documentation

Run the demo:

```bash
elide run elide-velocityjs.ts
```

## Links

- [Original npm package](https://www.npmjs.com/package/velocityjs)

---

**Built with ❤️ for the Elide Polyglot Runtime**
