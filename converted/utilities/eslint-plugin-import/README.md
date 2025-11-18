# ESLint Plugin Import - Elide Polyglot Showcase

> **Import/export validation** - Prevent import-related bugs

ESLint plugin to validate proper imports and help prevent issues.

## Features

- Validate import/export syntax
- Prevent missing imports
- Detect circular dependencies
- Enforce module boundaries
- **~15M downloads/week on npm**

## Quick Start

```typescript
import importPlugin from './elide-eslint-plugin-import.ts';

const code = `const x = 10;\nimport React from 'react';`;
const result = importPlugin.validate(code);
```

## Links

- [Original npm package](https://www.npmjs.com/package/eslint-plugin-import)

---

**Built with ❤️ for the Elide Polyglot Runtime**
