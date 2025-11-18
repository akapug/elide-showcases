# Combyne - Elide Polyglot Showcase

> **One versatile template engine for ALL languages** - TypeScript, Python, Ruby, and Java

Template engine combining the best features of multiple engines.

## Features

- Handlebars-like syntax
- Filters and helpers
- Partials
- Custom delimiters
- **~100K downloads/week on npm**

## Quick Start

```typescript
import Combyne from './elide-combyne.ts';

const combyne = new Combyne();
const html = combyne.render('{{ name | uppercase }}', { name: 'world' });
```

## Links

- [Original npm package](https://www.npmjs.com/package/combyne)

---

**Built with ❤️ for the Elide Polyglot Runtime**
