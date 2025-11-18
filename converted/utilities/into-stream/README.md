# Into Stream - Convert to Stream

Convert values into readable streams.

Based on [into-stream](https://www.npmjs.com/package/into-stream) (~500K+ downloads/week)

## Features

- ✅ Convert strings to streams
- ✅ Convert arrays to streams
- ✅ Zero dependencies

## Quick Start

```typescript
import intoStream from './elide-into-stream.ts';

const stream = intoStream('Hello World');
stream.on('data', chunk => console.log(chunk));

const arrayStream = intoStream(['a', 'b', 'c']);
```

## Polyglot Benefits

Works across JavaScript, Python, Ruby, and Java via Elide!
