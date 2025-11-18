# interval-tree - Elide Polyglot Showcase

> **Interval tree data structure for ALL languages** - TypeScript, Python, Ruby, and Java

## Features

- Efficient interval searching
- Point and range queries
- **~3M downloads/week on npm**

## Quick Start

```typescript
import IntervalTree from './elide-interval-tree.ts';

const tree = new IntervalTree();
tree.insert(1, 5, 'data');
tree.search(3); // Find intervals containing point
tree.searchInterval(2, 6); // Find overlapping intervals
```

## Links

- [Original npm package](https://www.npmjs.com/package/interval-tree)

---

**Built with ❤️ for the Elide Polyglot Runtime**
