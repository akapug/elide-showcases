# Stdout Stderr - Stream Mocking

Mock stdout and stderr streams.

Based on [stdout-stderr](https://www.npmjs.com/package/stdout-stderr) (~100K+ downloads/week)

## Features

- ✅ Mock both stdout and stderr
- ✅ Capture all output
- ✅ Zero dependencies

## Quick Start

```typescript
import stdoutStderr from './elide-stdout-stderr.ts';

stdoutStderr.start();
console.log('normal');
console.error('error');
const { stdout, stderr } = stdoutStderr.stop();
```

## Polyglot Benefits

Works across JavaScript, Python, Ruby, and Java via Elide!
