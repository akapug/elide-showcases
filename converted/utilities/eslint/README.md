# eslint - Elide Polyglot Showcase

> **JavaScript and TypeScript linter for ALL languages** - TypeScript, Python, Ruby, and Java

## Features

- Pluggable linting utility for JavaScript/TypeScript
- Find and fix problems automatically
- Enforce code style and best practices
- **80M+ downloads/week on npm**
- Custom rules and configurations
- Auto-fix support

## Quick Start

```typescript
import { ESLint } from './elide-eslint.ts';

const eslint = new ESLint({
  rules: {
    'semi': 'error',
    'quotes': 'warn',
    'no-console': 'off',
  },
});

const results = await eslint.lintText(code);
console.log('Errors:', results[0].errorCount);
console.log('Warnings:', results[0].warningCount);
```

## Links

- [Original npm package](https://www.npmjs.com/package/eslint)

---

**Built with ❤️ for the Elide Polyglot Runtime**
