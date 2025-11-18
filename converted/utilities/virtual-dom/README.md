# Virtual DOM - Elide Polyglot Showcase

> **One Virtual DOM for ALL languages** - TypeScript, Python, Ruby, and Java

A virtual DOM implementation with diffing and patching.

## Features

- Virtual DOM tree
- Efficient diffing
- DOM patching
- Event handling
- Component support
- **~3M downloads/week on npm**

## Quick Start

```typescript
import { h, createElement, diff, patch } from './elide-virtual-dom.ts';

const vnode = h('div', { class: 'container' }, [
  h('h1', ['Hello']),
  h('p', ['World'])
]);

const element = createElement(vnode);
document.body.appendChild(element);

const newVNode = h('div', { class: 'container' }, [
  h('h1', ['Hello']),
  h('p', ['Universe'])
]);

const patches = diff(vnode, newVNode);
patch(element, patches);
```

## Links

- [Original npm package](https://www.npmjs.com/package/virtual-dom)

---

**Built with ❤️ for the Elide Polyglot Runtime**
