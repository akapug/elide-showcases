# Rewire - Module Rewiring

Access and modify private variables in modules.

Based on [rewire](https://www.npmjs.com/package/rewire) (~200K+ downloads/week)

## Features

- ✅ Access private variables
- ✅ Mock internal dependencies
- ✅ Zero dependencies

## Quick Start

```typescript
import rewire from './elide-rewire.ts';

const myModule = rewire('./myModule');
myModule.__set__('privateVar', 'new value');
console.log(myModule.__get__('privateVar'));
```

## Polyglot Benefits

Works across JavaScript, Python, Ruby, and Java via Elide!
