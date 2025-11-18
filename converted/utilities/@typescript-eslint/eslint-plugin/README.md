# @typescript-eslint/eslint-plugin - Elide Polyglot Showcase

> **TypeScript ESLint rules for ALL languages** - TypeScript, Python, Ruby, and Java

## Features

- 100+ TypeScript-specific lint rules
- Type-aware rules for better checking
- Best practice enforcement
- **40M+ downloads/week on npm**
- Recommended and strict configs
- Auto-fix support

## Quick Start

```typescript
import { rules, configs } from './elide-typescript-eslint-plugin.ts';

// Use in ESLint config
const eslintConfig = {
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  extends: ['plugin:@typescript-eslint/recommended'],
  rules: {
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/explicit-function-return-type': 'warn',
  },
};
```

## Links

- [Original npm package](https://www.npmjs.com/package/@typescript-eslint/eslint-plugin)

---

**Built with ❤️ for the Elide Polyglot Runtime**
