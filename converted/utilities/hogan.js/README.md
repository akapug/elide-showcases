# Hogan.js - Elide Polyglot Showcase

> **One Mustache compiler for ALL languages** - TypeScript, Python, Ruby, and Java

A compiler for the Mustache templating language with fast rendering.

## Features

- Mustache template compilation
- Fast rendering
- Partials support
- Lambda support
- Section iteration
- Inverted sections
- **~3M downloads/week on npm**

## Quick Start

```typescript
import Hogan from './elide-hogan.js.ts';

const hogan = new Hogan();
const tmpl = hogan.compile("Hello {{name}}!");

console.log(tmpl.render({ name: "World" }));
```

## Documentation

Run the demo:

```bash
elide run elide-hogan.js.ts
```

## Links

- [Original npm package](https://www.npmjs.com/package/hogan.js)

---

**Built with ❤️ for the Elide Polyglot Runtime**
