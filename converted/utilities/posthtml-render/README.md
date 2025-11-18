# PostHTML Render - Elide Polyglot Showcase

> **One PostHTML renderer for ALL languages** - TypeScript, Python, Ruby, and Java

Renders PostHTML AST back to HTML strings.

## Features

- AST to HTML rendering
- PostHTML compatible
- Fast rendering
- Pretty printing
- Minification support
- **~8M downloads/week on npm**

## Quick Start

```typescript
import { render } from './elide-posthtml-render.ts';

const ast = [
  {
    tag: 'div',
    attrs: { class: 'container' },
    content: [
      { tag: 'h1', content: ['Hello'] },
      { tag: 'p', content: ['World'] }
    ]
  }
];

const html = render(ast);
console.log(html);
// <div class="container"><h1>Hello</h1><p>World</p></div>
```

## Links

- [Original npm package](https://www.npmjs.com/package/posthtml-render)

---

**Built with ❤️ for the Elide Polyglot Runtime**
