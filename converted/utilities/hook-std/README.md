# Hook-Std - Hook Standard Streams

Hook and intercept stdout/stderr.

Based on [hook-std](https://www.npmjs.com/package/hook-std) (~100K+ downloads/week)

## Features

- Hook stdout/stderr
- Capture console output
- Stream interception
- Output filtering

## Quick Start

```typescript
import hookStd from './elide-hook-std.ts';

const unhook = hookStd(
  { stdout: true, stderr: true },
  (output) => {
    console.log('Captured:', output);
  }
);

console.log('This will be captured');
unhook();
```
