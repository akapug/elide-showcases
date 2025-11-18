# DOM Iterator - Elide Polyglot Showcase

> **One DOM iterator for ALL languages** - TypeScript, Python, Ruby, and Java

Utilities for iterating over DOM nodes and collections.

## Features

- Node iteration
- Collection iteration
- Iterator patterns
- Functional helpers
- **~3M downloads/week on npm**

## Quick Start

```typescript
import { iterate, iterateChildren, iterateDescendants } from './elide-dom-iterator.ts';

iterate(nodes).forEach(n => console.log(n));
const filtered = iterate(nodes).filter(n => n.nodeType === 1);

for (const child of iterateChildren(node)) {
  console.log(child);
}

for (const descendant of iterateDescendants(node)) {
  process(descendant);
}
```

## Links

- [Original npm package](https://www.npmjs.com/package/dom-iterator)

---

**Built with ❤️ for the Elide Polyglot Runtime**
