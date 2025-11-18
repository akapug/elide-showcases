# xo - Elide Polyglot Showcase

> **Opinionated JavaScript linter for ALL languages** - TypeScript, Python, Ruby, and Java

## Features

- Opinionated but highly configurable
- Beautiful, readable output
- Built on ESLint with sensible defaults
- **1M+ downloads/week on npm**
- TypeScript support out of the box
- Auto-fix support

## Quick Start

```typescript
import { XO } from './elide-xo.ts';

const xo = new XO({
  semicolon: true,
  space: 2,
  prettier: false,
});

const result = await xo.lintText(code);
console.log('Errors:', result.errorCount);
result.results[0].messages.forEach(msg => console.log(msg.message));
```

## Links

- [Original npm package](https://www.npmjs.com/package/xo)

---

**Built with ❤️ for the Elide Polyglot Runtime**
