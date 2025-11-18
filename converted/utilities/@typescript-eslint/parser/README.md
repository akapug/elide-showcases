# @typescript-eslint/parser - Elide Polyglot Showcase

> **TypeScript parser for ESLint for ALL languages** - TypeScript, Python, Ruby, and Java

## Features

- Parse TypeScript code for ESLint
- Type-aware linting support
- TSConfig integration
- **40M+ downloads/week on npm**
- JSX and decorators support
- Latest TypeScript syntax

## Quick Start

```typescript
import { parse, parseForESLint } from './elide-typescript-eslint-parser.ts';

const result = parseForESLint(tsCode, {
  sourceType: 'module',
  project: './tsconfig.json',
});

console.log(result.ast);
console.log(result.services.program);
```

## Links

- [Original npm package](https://www.npmjs.com/package/@typescript-eslint/parser)

---

**Built with ❤️ for the Elide Polyglot Runtime**
