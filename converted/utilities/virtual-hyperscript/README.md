# Virtual Hyperscript - Elide Polyglot Showcase

> **One virtual h() for ALL languages** - TypeScript, Python, Ruby, and Java

Create virtual DOM nodes with hyperscript syntax.

## Features

- Virtual node creation
- Hyperscript syntax
- Props and children
- Key support
- Event handlers
- **~3M downloads/week on npm**

## Quick Start

```typescript
import { h, div, h1, p } from './elide-virtual-hyperscript.ts';

const vnode = div({ className: 'container' }, [
  h1('Hello World'),
  p({ style: { color: 'blue' } }, 'This is a paragraph'),
  div({ key: 'footer' }, 'Footer')
]);

console.log(vnode.type); // 'div'
console.log(vnode.children.length); // 3
```

## Links

- [Original npm package](https://www.npmjs.com/package/virtual-hyperscript)

---

**Built with ❤️ for the Elide Polyglot Runtime**
