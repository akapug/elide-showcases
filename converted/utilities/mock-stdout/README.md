# Mock Stdout - STDOUT Mocking

Mock process.stdout for testing.

Based on [mock-stdout](https://www.npmjs.com/package/mock-stdout) (~20K+ downloads/week)

## Features

- ✅ Mock stdout output
- ✅ Capture output
- ✅ Zero dependencies

## Quick Start

```typescript
import stdout from './elide-mock-stdout.ts';

const mockStdout = stdout();
mockStdout.start();
console.log('test');
const output = mockStdout.stop();
```

## Polyglot Benefits

Works across JavaScript, Python, Ruby, and Java via Elide!
