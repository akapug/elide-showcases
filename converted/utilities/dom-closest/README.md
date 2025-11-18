# DOM Closest - Elide Polyglot Showcase

> **One closest() helper for ALL languages** - TypeScript, Python, Ruby, and Java

Polyfill and utility for Element.closest() method.

## Features

- Element.closest() polyfill
- Traverse up the DOM tree
- CSS selector matching
- Cross-browser support
- **~15M downloads/week on npm**

## Quick Start

```typescript
import { closest, matches, closestChild } from './elide-dom-closest.ts';

const container = closest(element, '.container');
const article = closest(element, 'article');
const hasClass = matches(element, '.active');
const child = closestChild(parent, element, '.item');
```

## Links

- [Original npm package](https://www.npmjs.com/package/dom-closest)

---

**Built with ❤️ for the Elide Polyglot Runtime**
