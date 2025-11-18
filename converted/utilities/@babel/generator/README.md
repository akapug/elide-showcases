# @babel/generator - Elide Polyglot Showcase

> **Code generator from AST for ALL languages** - TypeScript, Python, Ruby, and Java

## Features

- Generate code from Babel AST
- Source map generation
- Compact or readable output
- **80M+ downloads/week on npm**
- Comment preservation
- Configurable formatting

## Quick Start

```typescript
import generate from './elide-babel-generator.ts';

const result = generate(ast, {
  compact: false,
  comments: true,
  sourceMaps: true,
});

console.log(result.code);
console.log(result.map);
```

## Links

- [Original npm package](https://www.npmjs.com/package/@babel/generator)

---

**Built with ❤️ for the Elide Polyglot Runtime**
