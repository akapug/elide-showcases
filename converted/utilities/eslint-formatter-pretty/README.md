# ESLint Formatter Pretty - Elide Polyglot Showcase

> **Beautiful ESLint output** - Make linting errors pretty

Pretty formatter for ESLint with colors and better readability.

## Features

- Colorful output
- File grouping
- Error highlighting
- **~100K downloads/week on npm**

## Quick Start

```typescript
import prettyFormatter from './elide-eslint-formatter-pretty.ts';

const results = [{ filePath: '/src/app.ts', messages: [...], errorCount: 1, warningCount: 1 }];
console.log(prettyFormatter.format(results));
```

## Links

- [Original npm package](https://www.npmjs.com/package/eslint-formatter-pretty)

---

**Built with ❤️ for the Elide Polyglot Runtime**
