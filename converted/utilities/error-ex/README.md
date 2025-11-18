# error-ex - Elide Polyglot Showcase

> **Easy error subclassing for ALL languages** - TypeScript, Python, Ruby, and Java

## Features

- Create custom error classes
- Attach metadata to errors
- Prototype chain preservation
- **~80M downloads/week on npm**

## Quick Start

```typescript
import errorEx from './elide-error-ex.ts';

const JSONError = errorEx('JSONError', { code: 'EJSON' });
const err = new JSONError('Parse failed');
err.fileName = 'config.json';

console.log(err.name); // 'JSONError'
console.log(err.code); // 'EJSON'
```

## Links

- [Original npm package](https://www.npmjs.com/package/error-ex)

---

**Built with ❤️ for the Elide Polyglot Runtime**
