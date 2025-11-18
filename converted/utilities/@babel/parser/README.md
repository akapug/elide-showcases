# @babel/parser - Elide Polyglot Showcase

> **Babel JavaScript parser for ALL languages** - TypeScript, Python, Ruby, and Java

## Features

- Parse modern JavaScript with latest features
- JSX and TypeScript support built-in
- Flow syntax support
- **80M+ downloads/week on npm**
- Extensive plugin system
- Error recovery and source tracking

## Quick Start

```typescript
import { parse, parseExpression } from './elide-babel-parser.ts';

const ast = parse(code, {
  sourceType: 'module',
  plugins: ['jsx', 'typescript'],
});

console.log(ast.program.body); // AST nodes
```

## Links

- [Original npm package](https://www.npmjs.com/package/@babel/parser)

---

**Built with ❤️ for the Elide Polyglot Runtime**
