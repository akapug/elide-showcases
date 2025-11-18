# DOM Select - Elide Polyglot Showcase

> **One selector engine for ALL languages** - TypeScript, Python, Ruby, and Java

Efficient CSS selector engine for DOM queries.

## Features

- CSS selector parsing
- Fast query execution
- Standards-compliant
- Tree traversal helpers
- **~3M downloads/week on npm**

## Quick Start

```typescript
import { select, selectAll, matches, closest } from './elide-dom-select.ts';

const container = select('.container');
const items = selectAll('div.item');
const isActive = matches(element, '.active');
const article = closest(element, 'article');
```

## Links

- [Original npm package](https://www.npmjs.com/package/dom-select)

---

**Built with ❤️ for the Elide Polyglot Runtime**
