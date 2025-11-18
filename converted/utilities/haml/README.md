# HAML - Elide Polyglot Showcase

> **One beautiful markup language for ALL languages** - TypeScript, Python, Ruby, and Java

HTML Abstraction Markup Language - beautiful, DRY, well-indented markup.

## Features

- Whitespace active syntax
- Elegant HTML generation
- Ruby-style interpolation
- Clean, DRY templates
- Automatic tag closing
- CSS-style ID/class shortcuts
- **~1M downloads/week on npm**

## Quick Start

```typescript
import Haml from './elide-haml.ts';

const haml = new Haml();

const template = `
%html
  %body
    %h1 Hello #{name}!
`;

console.log(haml.render(template, { name: "World" }));
```

## Documentation

Run the demo:

```bash
elide run elide-haml.ts
```

## Links

- [Original npm package](https://www.npmjs.com/package/haml)

---

**Built with ❤️ for the Elide Polyglot Runtime**
