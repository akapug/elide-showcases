# Hyperscript - Elide Polyglot Showcase

> **One hyperscript for ALL languages** - TypeScript, Python, Ruby, and Java

Create HTML elements with a concise syntax.

## Features

- Concise element creation
- CSS selector syntax
- Event binding
- Property setting
- Nested children
- **~8M downloads/week on npm**

## Quick Start

```typescript
import h, { div, span, button } from './elide-hyperscript.ts';

const app = h('div#app.container', [
  h('h1', 'Hello World'),
  button({ onclick: () => alert('Clicked!') }, 'Click Me'),
  div('.box', [
    span('Item 1'),
    span('Item 2')
  ])
]);

document.body.appendChild(app);
```

## Links

- [Original npm package](https://www.npmjs.com/package/hyperscript)

---

**Built with ❤️ for the Elide Polyglot Runtime**
