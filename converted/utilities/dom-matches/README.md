# DOM Matches - Elide Polyglot Showcase

> **One matches() helper for ALL languages** - TypeScript, Python, Ruby, and Java

Polyfill for Element.matches() method.

## Features

- Element.matches() polyfill
- CSS selector matching
- Cross-browser support
- Vendor prefix handling
- **~15M downloads/week on npm**

## Quick Start

```typescript
import { matches, matchesAny, filter } from './elide-dom-matches.ts';

const isActive = matches(element, '.active');
const hasClass = matches(element, 'div.item');
const anyMatch = matchesAny(element, ['.a', '.b']);
const visible = filter(elements, '.visible');
```

## Links

- [Original npm package](https://www.npmjs.com/package/dom-matches)

---

**Built with ❤️ for the Elide Polyglot Runtime**
