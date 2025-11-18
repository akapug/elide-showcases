# Node HTML Parser - Elide Polyglot Showcase

> **One HTML parser for ALL languages** - TypeScript, Python, Ruby, and Java

Fast and forgiving HTML/XML parser with CSS selector support.

## Features

- Fast HTML parsing
- CSS selector support
- Forgiving parser
- DOM-like API
- Low memory usage
- **~8M downloads/week on npm**

## Quick Start

```typescript
import { parse } from './elide-node-html-parser.ts';

const html = '<div><h1>Title</h1><p>Content</p></div>';
const root = parse(html);

console.log(root.textContent);
const h1 = root.querySelector('h1');
const paragraphs = root.querySelectorAll('p');
```

## Links

- [Original npm package](https://www.npmjs.com/package/node-html-parser)

---

**Built with ❤️ for the Elide Polyglot Runtime**
