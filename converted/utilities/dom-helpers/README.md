# DOM Helpers - Elide Polyglot Showcase

> **One DOM helpers library for ALL languages** - TypeScript, Python, Ruby, and Java

Collection of useful DOM manipulation helper functions.

## Features

- Class manipulation
- Style management
- Event handling
- Query utilities
- Animation helpers
- **~30M downloads/week on npm**

## Quick Start

```typescript
import { addClass, css, offset, matches } from './elide-dom-helpers.ts';

const el = document.querySelector('.box');
addClass(el, 'active');
css(el, 'color', 'red');
console.log(offset(el)); // { top: 100, left: 50 }
console.log(matches(el, '.selected'));
```

## Links

- [Original npm package](https://www.npmjs.com/package/dom-helpers)

---

**Built with ❤️ for the Elide Polyglot Runtime**
