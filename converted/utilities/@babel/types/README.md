# @babel/types - Elide Polyglot Showcase

> **AST node types and utilities for ALL languages** - TypeScript, Python, Ruby, and Java

## Features

- AST node builders for all JavaScript constructs
- Type validators and checkers
- Node cloning and manipulation
- **80M+ downloads/week on npm**
- Constant evaluation helpers
- Type-safe AST creation

## Quick Start

```typescript
import * as t from './elide-babel-types.ts';

// Build AST nodes
const id = t.identifier('x');
const value = t.numericLiteral(42);
const declaration = t.variableDeclaration('const', [
  t.variableDeclarator(id, value),
]);

// Check types
if (t.isIdentifier(node)) {
  console.log(node.name);
}
```

## Links

- [Original npm package](https://www.npmjs.com/package/@babel/types)

---

**Built with ❤️ for the Elide Polyglot Runtime**
