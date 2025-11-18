# Twig - Elide Polyglot Showcase

> **One Twig engine for ALL languages** - TypeScript, Python, Ruby, and Java

JS implementation of the Twig template engine, perfect for PHP developers.

## Features

- Twig template syntax
- Template inheritance
- Filters and functions
- Control structures
- Auto-escaping
- Extensible
- **~1M downloads/week on npm**

## Quick Start

```typescript
import Twig from './elide-twig.ts';

const twig = new Twig();
const tmpl = twig.twig({ data: "Hello {{ name|upper }}!" });

console.log(tmpl.render({ name: "world" }));
```

## Documentation

Run the demo:

```bash
elide run elide-twig.ts
```

## Links

- [Original npm package](https://www.npmjs.com/package/twig)

---

**Built with ❤️ for the Elide Polyglot Runtime**
