# String to Stream - String Stream Conversion

Convert strings to readable streams.

Based on [string-to-stream](https://www.npmjs.com/package/string-to-stream) (~100K+ downloads/week)

## Features

- ✅ String to stream conversion
- ✅ Encoding support
- ✅ Zero dependencies

## Quick Start

```typescript
import stringToStream from './elide-string-to-stream.ts';

const stream = stringToStream('Hello World');
stream.on('data', chunk => console.log(chunk));
stream.on('end', () => console.log('done'));
```

## Polyglot Benefits

Works across JavaScript, Python, Ruby, and Java via Elide!
