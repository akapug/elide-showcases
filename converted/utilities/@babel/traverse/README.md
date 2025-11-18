# @babel/traverse - Elide Polyglot Showcase

> **AST traversal and modification for ALL languages** - TypeScript, Python, Ruby, and Java

## Features

- Traverse and modify Babel AST
- Visitor pattern for clean code
- Automatic scope tracking
- **80M+ downloads/week on npm**
- Path utilities for node manipulation
- Parent and sibling tracking

## Quick Start

```typescript
import traverse from './elide-babel-traverse.ts';

traverse(ast, {
  enter(path) {
    console.log('Entering:', path.node.type);
  },
  FunctionDeclaration(path) {
    console.log('Found function:', path.node.id.name);
    path.node.id.name = 'renamed';
  },
});
```

## Links

- [Original npm package](https://www.npmjs.com/package/@babel/traverse)

---

**Built with ❤️ for the Elide Polyglot Runtime**
