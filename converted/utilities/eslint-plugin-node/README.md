# ESLint Plugin Node - Elide Polyglot Showcase

> **Node.js-specific linting rules** - Best practices for Node.js

Additional ESLint rules for Node.js applications.

## Features

- Validate require() calls
- Check package.json dependencies
- Prevent deprecated APIs
- **~2M downloads/week on npm**

## Quick Start

```typescript
import nodePlugin from './elide-eslint-plugin-node.ts';

const config = nodePlugin.getConfig();
const result = nodePlugin.validate('process.exit(1);');
```

## Links

- [Original npm package](https://www.npmjs.com/package/eslint-plugin-node)

---

**Built with ❤️ for the Elide Polyglot Runtime**
