# DOM Walk - Elide Polyglot Showcase

> **One DOM walker for ALL languages** - TypeScript, Python, Ruby, and Java

Utility for walking and traversing DOM trees.

## Features

- DOM tree traversal
- Node filtering
- Depth-first walking
- Callback support
- **~40M downloads/week on npm**

## Quick Start

```typescript
import { walk, walkElements, collectElements, findNode } from './elide-dom-walk.ts';

walk(node, n => console.log(n.nodeName));
walkElements(node, el => el.classList.add('processed'));
const elements = collectElements(node);
const target = findNode(node, n => n.id === 'target');
```

## Links

- [Original npm package](https://www.npmjs.com/package/dom-walk)

---

**Built with ❤️ for the Elide Polyglot Runtime**
