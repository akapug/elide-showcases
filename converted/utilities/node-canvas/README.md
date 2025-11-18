# node-canvas - Elide Polyglot Showcase

> **Canvas API for Node.js for ALL languages** - TypeScript, Python, Ruby, and Java

## Features

- Server-side Canvas API
- Cairo-backed rendering
- Generate images, PDFs
- **~8M downloads/week on npm**

## Quick Start

```typescript
import nodecanvas from './elide-node-canvas.ts';

const canvas = createCanvas(800, 600);
const ctx = canvas.getContext('2d');
ctx.fillStyle = '#FF5733';
ctx.fillRect(0, 0, 400, 300);
console.log('Canvas:', canvas.width, 'x', canvas.height);
```

## Links

- [Original npm package](https://www.npmjs.com/package/node-canvas)

---

**Built with ❤️ for the Elide Polyglot Runtime**
