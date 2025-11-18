# HTML DOM Parser - Elide Polyglot Showcase

> **One HTML-to-DOM converter for ALL languages** - TypeScript, Python, Ruby, and Java

Converts HTML strings to DOM nodes.

## Features

- HTML string parsing
- DOM node creation
- Fast conversion
- Browser and Node.js support
- **~5M downloads/week on npm**

## Quick Start

```typescript
import { parse, domToReact } from './elide-html-dom-parser.ts';

const html = '<div class="container"><h1>Hello</h1><p>World</p></div>';
const nodes = parse(html);

console.log(nodes[0]?.name); // 'div'
console.log(nodes[0]?.attribs); // { class: 'container' }

const reactElements = domToReact(nodes);
```

## Links

- [Original npm package](https://www.npmjs.com/package/html-dom-parser)

---

**Built with ❤️ for the Elide Polyglot Runtime**
