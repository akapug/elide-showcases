# Mock Require - Simple Require Mocking

Simple and effective mock support for require() in tests.

Based on [mock-require](https://www.npmjs.com/package/mock-require) (~100K+ downloads/week)

## Features

- ✅ Mock require() calls
- ✅ Simple API
- ✅ Module cache control
- ✅ Zero dependencies

## Quick Start

```typescript
import mock from './elide-mock-require.ts';

mock('fs', { readFileSync: () => 'mocked' });
const fs = require('fs');
console.log(fs.readFileSync()); // 'mocked'

mock.stopAll();
```

## Polyglot Benefits

Works across JavaScript, Python, Ruby, and Java via Elide!
