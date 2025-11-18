# From2 String - String to Stream

Create readable stream from string.

Based on [from2-string](https://www.npmjs.com/package/from2-string) (~100K+ downloads/week)

## Features

- ✅ String to stream conversion
- ✅ Readable stream API
- ✅ Zero dependencies

## Quick Start

```typescript
import from2String from './elide-from2-string.ts';

const stream = from2String('Hello World');
stream.on('data', chunk => console.log(chunk));
```

## Polyglot Benefits

Works across JavaScript, Python, Ruby, and Java via Elide!
