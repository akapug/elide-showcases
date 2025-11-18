# DOMHandler - Elide Polyglot Showcase

> **One DOM handler for ALL languages** - TypeScript, Python, Ruby, and Java

Handler for htmlparser2 that constructs DOM trees.

## Features

- DOM tree construction
- HTML parsing support
- Node manipulation
- **~120M downloads/week on npm**

## Quick Start

```typescript
import DOMHandler from './elide-domhandler.ts';

const handler = new DOMHandler();
handler.onopentag('div', { class: 'test' });
handler.ontext('Hello');
handler.onclosetag();

console.log(handler.getDOM());
```

## Links

- [Original npm package](https://www.npmjs.com/package/domhandler)

---

**Built with ❤️ for the Elide Polyglot Runtime**
