# ESLint Plugin Promise - Elide Polyglot Showcase

> **Promise best practices** - Write better async code

Enforce best practices for JavaScript promises.

## Features

- Catch error handling
- Promise return patterns
- Async/await best practices
- **~3M downloads/week on npm**

## Quick Start

```typescript
import promisePlugin from './elide-eslint-plugin-promise.ts';

const result = promisePlugin.validate('fetch("/api").then(r => r.json());');
console.log(result);
```

## Links

- [Original npm package](https://www.npmjs.com/package/eslint-plugin-promise)

---

**Built with ❤️ for the Elide Polyglot Runtime**
