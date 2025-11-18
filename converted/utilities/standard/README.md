# standard - Elide Polyglot Showcase

> **JavaScript Standard Style for ALL languages** - TypeScript, Python, Ruby, and Java

## Features

- Zero configuration JavaScript linter
- Automatic code formatting
- Catch style issues and bugs early
- **5M+ downloads/week on npm**
- Built on ESLint and Prettier
- Auto-fix support

## Quick Start

```typescript
import { Standard, lintText } from './elide-standard.ts';

// Simple API
const result = await lintText(code);
console.log('Errors:', result.errorCount);

// Advanced usage
const standard = new Standard();
const result = await standard.lintText(code, { filename: 'app.js' });
result.results[0].messages.forEach(msg => console.log(msg.message));
```

## Links

- [Original npm package](https://www.npmjs.com/package/standard)

---

**Built with ❤️ for the Elide Polyglot Runtime**
