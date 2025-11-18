# Snabbdom - Elide Polyglot Showcase

> **One Snabbdom for ALL languages** - TypeScript, Python, Ruby, and Java

A simple, modular virtual DOM library with focus on simplicity.

## Features

- Minimal virtual DOM
- Module system
- Hooks support
- Fast diffing
- TypeScript support
- **~5M downloads/week on npm**

## Quick Start

```typescript
import { h, init } from './elide-snabbdom.ts';

const patch = init([]);

const vnode = h('div#container', [
  h('span', { style: { fontWeight: 'bold' } }, 'Bold'),
  h('a', { attrs: { href: '/foo' } }, 'Link')
]);

const container = document.getElementById('app');
patch(container, vnode);
```

## Links

- [Original npm package](https://www.npmjs.com/package/snabbdom)

---

**Built with ❤️ for the Elide Polyglot Runtime**
