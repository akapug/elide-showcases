# typescript-eslint - Elide Polyglot Showcase

> **TypeScript ESLint monorepo for ALL languages** - TypeScript, Python, Ruby, and Java

## Features

- Complete TypeScript linting solution
- Parser and plugin combined
- Type-aware linting
- **5M+ downloads/week on npm**
- Multiple preset configurations
- Project references support

## Quick Start

```typescript
import { configs, createConfig } from './elide-typescript-eslint.ts';

// Use a preset config
const config = createConfig('recommended');

// Or customize
const customConfig = {
  ...configs.recommendedTypeChecked,
  rules: {
    ...configs.recommendedTypeChecked.rules,
    '@typescript-eslint/no-explicit-any': 'error',
  },
};
```

## Links

- [Original npm package](https://www.npmjs.com/package/typescript-eslint)

---

**Built with ❤️ for the Elide Polyglot Runtime**
