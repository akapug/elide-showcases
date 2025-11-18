# Squirrelly - Elide Polyglot Showcase

> **One lightweight template engine for ALL languages** - TypeScript, Python, Ruby, and Java

Powerful, lightweight template engine with minimal footprint and maximum features.

## Features

- Lightweight and fast
- Helpers and filters
- Partials support
- Custom delimiters
- Caching
- Async support
- **~500K downloads/week on npm**

## Quick Start

```typescript
import Squirrelly from './elide-squirrelly.ts';

const sqrl = new Squirrelly();

const template = "Hello {{name}}!";
console.log(sqrl.render(template, { name: "World" }));
```

## Documentation

Run the demo:

```bash
elide run elide-squirrelly.ts
```

## Links

- [Original npm package](https://www.npmjs.com/package/squirrelly)

---

**Built with ❤️ for the Elide Polyglot Runtime**
