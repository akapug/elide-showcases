# eslint-visitor-keys - Elide Polyglot Showcase

> **AST visitor keys for ALL languages** - TypeScript, Python, Ruby, and Java

## Features

- AST node visitor key definitions
- Node type traversal utilities
- ES6+ node support
- **80M+ downloads/week on npm**
- Union type handling
- Key validation

## Quick Start

```typescript
import { getKeys, KEYS, unionWith } from './elide-eslint-visitor-keys.ts';

// Get keys for a node type
const keys = getKeys({ type: 'FunctionDeclaration' });
console.log(keys); // ['id', 'params', 'body']

// Access all keys
console.log(KEYS.Program); // ['body']

// Extend with custom keys
const extended = unionWith({
  CustomNode: ['customProp'],
});
```

## Links

- [Original npm package](https://www.npmjs.com/package/eslint-visitor-keys)

---

**Built with ❤️ for the Elide Polyglot Runtime**
