# Jade - Elide Polyglot Showcase

> **One elegant template engine for ALL languages** - TypeScript, Python, Ruby, and Java

Robust, elegant, feature-rich template engine with clean syntax (predecessor to Pug).

## Features

- Clean, whitespace-sensitive syntax
- Powerful inline JavaScript
- Template inheritance
- Mixins for reusable blocks
- Includes and partials
- Interpolation
- **~8M downloads/week on npm**

## Quick Start

```typescript
import Jade from './elide-jade.ts';

const jade = new Jade({ pretty: true });

const template = `
doctype html
html
  body
    h1 Hello #{name}!
`;

console.log(jade.render(template, { name: "World" }));
```

## Documentation

Run the demo:

```bash
elide run elide-jade.ts
```

## Links

- [Original npm package](https://www.npmjs.com/package/jade)

---

**Built with ❤️ for the Elide Polyglot Runtime**
