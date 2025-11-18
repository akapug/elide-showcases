# HTML React Parser - Elide Polyglot Showcase

> **One HTML-to-React converter for ALL languages** - TypeScript, Python, Ruby, and Java

Converts HTML strings to React elements.

## Features

- HTML to React conversion
- Preserve attributes
- Custom element replacement
- TypeScript support
- Fast parsing
- **~8M downloads/week on npm**

## Quick Start

```typescript
import parse from './elide-html-react-parser.ts';

const html = '<div class="container"><h1>Hello</h1><p>World</p></div>';
const elements = parse(html);

// With custom replacement
const customElements = parse(html, {
  replace: (node) => {
    if (node.type === 'h1') {
      return { ...node, props: { ...node.props, className: 'title' } };
    }
  }
});
```

## Links

- [Original npm package](https://www.npmjs.com/package/html-react-parser)

---

**Built with ❤️ for the Elide Polyglot Runtime**
