# JSDOM - Elide Polyglot Showcase

> **One DOM implementation for ALL languages** - TypeScript, Python, Ruby, and Java

JavaScript implementation of web standards for server-side use.

## Features

- Full DOM implementation
- HTML parsing
- CSS selectors
- **~40M downloads/week on npm**

## Quick Start

```typescript
import JSDOM from './elide-jsdom.ts';

const dom = new JSDOM('<html><body><h1>Hello</h1></body></html>');
const h1 = dom.window.document.querySelector('h1');
console.log(h1.textContent);
```

## Links

- [Original npm package](https://www.npmjs.com/package/jsdom)

---

**Built with ❤️ for the Elide Polyglot Runtime**
