# buffer-equal - Buffer Equality Check

Fast buffer comparison to determine if two buffers are equal.

Based on [buffer-equal](https://www.npmjs.com/package/buffer-equal) (~1M+ downloads/week)

## Quick Start

```typescript
import bufferEqual from './elide-buffer-equal.ts';

const buf1 = new Uint8Array([1, 2, 3]);
const buf2 = new Uint8Array([1, 2, 3]);
console.log(bufferEqual(buf1, buf2)); // true
```

## Use Cases

- Verify file integrity
- Compare hash digests
- Test binary data
