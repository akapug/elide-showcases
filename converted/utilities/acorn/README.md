# acorn - Elide Polyglot Showcase

> **Fast JavaScript parser for ALL languages** - TypeScript, Python, Ruby, and Java

## Features

- Fast, compact JavaScript parser written in JavaScript
- Full ECMAScript 2021 support
- Location tracking and source ranges
- **120M+ downloads/week on npm**
- Plugin system for extensions
- Low memory footprint

## Quick Start

```typescript
import { parse } from './elide-acorn.ts';

const ast = parse('const x = 1;', {
  ecmaVersion: 2021,
  sourceType: 'module',
  locations: true,
});

console.log(ast.type); // 'Program'
console.log(ast.body[0].type); // 'VariableDeclaration'
```

## Links

- [Original npm package](https://www.npmjs.com/package/acorn)

---

**Built with ❤️ for the Elide Polyglot Runtime**
