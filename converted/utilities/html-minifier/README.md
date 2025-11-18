# HTML Minifier - Elide Polyglot Showcase

> **One HTML minifier for ALL languages** - TypeScript, Python, Ruby, and Java

Highly configurable HTML minifier with CSS/JS minification support.

## Features

- Remove whitespace and comments
- Collapse inline tags
- Minify inline CSS/JS
- Remove optional tags
- Configurable options
- **~15M downloads/week on npm**

## Quick Start

```typescript
import HTMLMinifier from './elide-html-minifier.ts';

const minifier = new HTMLMinifier();

const html = '<div>  <p>Hello</p>  </div>';
const minified = minifier.minify(html, { collapseWhitespace: true });

console.log(minified); // <div><p>Hello</p></div>
```

## Documentation

Run the demo:

```bash
elide run elide-html-minifier.ts
```

## Links

- [Original npm package](https://www.npmjs.com/package/html-minifier)

---

**Built with ❤️ for the Elide Polyglot Runtime**
