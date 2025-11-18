# Mock Stdin - STDIN Mocking

Mock process.stdin for testing.

Based on [mock-stdin](https://www.npmjs.com/package/mock-stdin) (~50K+ downloads/week)

## Features

- ✅ Mock stdin input
- ✅ Simulate user input
- ✅ Zero dependencies

## Quick Start

```typescript
import stdin from './elide-mock-stdin.ts';

const mockStdin = stdin();
mockStdin.on('data', chunk => {
  console.log(chunk.toString());
});
mockStdin.send('test\\n');
```

## Polyglot Benefits

Works across JavaScript, Python, Ruby, and Java via Elide!
