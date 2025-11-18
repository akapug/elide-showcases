# ESLint Plugin Prettier - Elide Polyglot Showcase

> **Prettier as ESLint rules** - Formatting meets linting

Run Prettier as an ESLint rule and report differences as ESLint issues.

## Features

- Report formatting issues as lint errors
- Auto-fix with Prettier
- Integration with ESLint
- **~5M downloads/week on npm**

## Quick Start

```typescript
import prettierPlugin from './elide-eslint-plugin-prettier.ts';

const formatted = prettierPlugin.format('const  x = "hello";');
console.log(formatted); // const x = 'hello';
```

## Links

- [Original npm package](https://www.npmjs.com/package/eslint-plugin-prettier)

---

**Built with ❤️ for the Elide Polyglot Runtime**
