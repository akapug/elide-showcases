# Dust - Elide Polyglot Showcase

> **One async template engine for ALL languages** - TypeScript, Python, Ruby, and Java

Asynchronous templating for the browser and Node.js with streaming support.

## Features

- Asynchronous and streaming operation
- Fast template rendering
- Logic-less templates
- Partials and inheritance
- Helper functions
- Context stack
- **~2M downloads/week on npm**

## Quick Start

```typescript
import Dust from './elide-dust.ts';

const dust = new Dust();

const template = "Hello {name}!";
console.log(dust.renderSource(template, { name: "World" }));
```

## Documentation

Run the demo:

```bash
elide run elide-dust.ts
```

## Links

- [Original npm package](https://www.npmjs.com/package/dustjs-linkedin)

---

**Built with ❤️ for the Elide Polyglot Runtime**
