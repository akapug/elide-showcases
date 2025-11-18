# Jest Mock Console - Console Mocking

Mock console methods in Jest tests.

Based on [jest-mock-console](https://www.npmjs.com/package/jest-mock-console) (~100K+ downloads/week)

## Features

- ✅ Mock console methods
- ✅ Capture output
- ✅ Zero dependencies

## Quick Start

```typescript
import mockConsole from './elide-jest-mock-console.ts';

mockConsole.mockLog();
console.log('test');
const logs = mockConsole.getLogs();
mockConsole.restore();
```

## Polyglot Benefits

Works across JavaScript, Python, Ruby, and Java via Elide!
