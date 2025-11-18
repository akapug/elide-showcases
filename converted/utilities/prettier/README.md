# prettier - Elide Polyglot Showcase

> **Opinionated code formatter for ALL languages** - TypeScript, Python, Ruby, and Java

## Features

- Automatic code formatting for JS, TS, CSS, HTML, Markdown
- Consistent style across entire team
- **50M+ downloads/week on npm**
- Minimal configuration needed
- Editor integration support

## Quick Start

```typescript
import { format, Prettier } from './elide-prettier.ts';

// Simple formatting
const formatted = format('const x={a:1,b:2}', {
  semi: true,
  singleQuote: true,
});

// Advanced usage
const prettier = new Prettier({ tabWidth: 2, semi: false });
const code = prettier.format(sourceCode, 'typescript');
const isFormatted = prettier.check(sourceCode);
```

## Links

- [Original npm package](https://www.npmjs.com/package/prettier)

---

**Built with ❤️ for the Elide Polyglot Runtime**
