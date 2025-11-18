# ESLint Formatter Codeframe - Elide Polyglot Showcase

> **ESLint with code context** - See errors in context

ESLint formatter that displays code context around errors.

## Features

- Show code context
- Syntax highlighting
- Error position markers
- **~500K downloads/week on npm**

## Quick Start

```typescript
import codeframeFormatter from './elide-eslint-formatter-codeframe.ts';

const results = [{ filePath: '/src/app.ts', messages: [...] }];
console.log(codeframeFormatter.format(results));
```

## Links

- [Original npm package](https://www.npmjs.com/package/eslint-formatter-codeframe)

---

**Built with ❤️ for the Elide Polyglot Runtime**
