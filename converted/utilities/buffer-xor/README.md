# buffer-xor - XOR Buffers

Bitwise XOR two buffers together for cryptography and data manipulation.

Based on [buffer-xor](https://www.npmjs.com/package/buffer-xor) (~500K+ downloads/week)

## Quick Start

```typescript
import bufferXor from './elide-buffer-xor.ts';

const buf1 = new Uint8Array([0xFF, 0x00, 0xAA]);
const buf2 = new Uint8Array([0x0F, 0xF0, 0x55]);
const result = bufferXor(buf1, buf2);

// In-place
bufferXor(buf1, buf2, true);
```

## Use Cases

- Cryptography (stream ciphers)
- Data obfuscation
- Error detection
