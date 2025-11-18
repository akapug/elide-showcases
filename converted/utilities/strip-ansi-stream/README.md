# Strip ANSI Stream - ANSI Code Stripping

Strip ANSI escape codes from streams.

Based on [strip-ansi-stream](https://www.npmjs.com/package/strip-ansi-stream) (~50K+ downloads/week)

## Features

- ✅ Strip ANSI codes from streams
- ✅ Transform stream
- ✅ Zero dependencies

## Quick Start

```typescript
import stripAnsiStream from './elide-strip-ansi-stream.ts';

const stream = stripAnsiStream();
const cleaned = stream.transform('\x1b[31mRed\x1b[0m');
console.log(cleaned); // 'Red'
```

## Polyglot Benefits

Works across JavaScript, Python, Ruby, and Java via Elide!
