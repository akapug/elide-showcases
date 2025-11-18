# Swig - Elide Polyglot Showcase

> **One Django-style template engine for ALL languages** - TypeScript, Python, Ruby, and Java

A simple, powerful, and extendable template engine with Django/Jinja2-like syntax.

## Features

- Django/Jinja2-like syntax
- Template inheritance
- Filters and tags
- Auto-escaping
- Custom filters
- Extensible
- **~3M downloads/week on npm**

## Quick Start

```typescript
import Swig from './elide-swig.ts';

const swig = new Swig();

const template = "Hello {{ name|upper }}!";
console.log(swig.render(template, { name: "world" }));
```

## Documentation

Run the demo:

```bash
elide run elide-swig.ts
```

## Links

- [Original npm package](https://www.npmjs.com/package/swig)

---

**Built with ❤️ for the Elide Polyglot Runtime**
