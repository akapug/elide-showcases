# h - Elide Polyglot Showcase

> **One h() helper for ALL languages** - TypeScript, Python, Ruby, and Java

Minimalist hyperscript function for creating elements.

## Features

- Minimal hyperscript
- Element creation
- Attribute setting
- Child appending
- CSS selector support
- **~8M downloads/week on npm**

## Quick Start

```typescript
import h from './elide-h.ts';

const app = h('div#app.container', [
  h('h1', 'Hello World'),
  h('button.primary', { onclick: () => alert('Hi!') }, 'Click'),
  h('ul', [
    h('li', 'Item 1'),
    h('li', 'Item 2')
  ])
]);

document.body.appendChild(app);
```

## Links

- [Original npm package](https://www.npmjs.com/package/h)

---

**Built with ❤️ for the Elide Polyglot Runtime**
