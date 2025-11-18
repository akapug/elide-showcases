# svgo - Elide Polyglot Showcase

> **SVG Optimizer for ALL languages** - TypeScript, Python, Ruby, and Java

## Features

- Optimize SVG files
- Remove metadata
- Minify paths and transforms
- **~30M downloads/week on npm**

## Quick Start

```typescript
import svgo from './elide-svgo.ts';

const result = optimize(svgString, {
  plugins: ['removeDoctype', 'removeComments']
});
console.log('Optimized SVG:', result.data.length, 'bytes');
```

## Links

- [Original npm package](https://www.npmjs.com/package/svgo)

---

**Built with ❤️ for the Elide Polyglot Runtime**
