# assert-plus - Elide Polyglot Showcase

> **Extra assertions on top of Node's assert for ALL languages** - TypeScript, Python, Ruby, and Java

## Features

- Type checking assertions
- Optional assertions
- Rich error messages
- **~80M downloads/week on npm**

## Quick Start

```typescript
import assert from './elide-assert-plus.ts';

function processData(data: any) {
  assert.object(data, 'Data must be an object');
  assert.string(data.name, 'Name must be a string');
  assert.number(data.age, 'Age must be a number');
  assert.optionalString(data.email);

  // Process data...
}
```

## Links

- [Original npm package](https://www.npmjs.com/package/assert-plus)

---

**Built with ❤️ for the Elide Polyglot Runtime**
