# buffer-fill - Fill Buffers with Values

Ponyfill for `Buffer.prototype.fill()` to fill buffers with specified values.

Based on [buffer-fill](https://www.npmjs.com/package/buffer-fill) (~2M+ downloads/week)

## Quick Start

```typescript
import bufferFill from './elide-buffer-fill.ts';

const buf = new Uint8Array(10);
bufferFill(buf, 0x42);
bufferFill(buf, "Hello", 0, 5);
```

## Use Cases

- Initialize buffers
- Clear memory
- Pattern filling
