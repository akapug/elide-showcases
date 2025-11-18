# buffer-alloc - Safe Buffer Allocation

Ponyfill for `Buffer.alloc()` with safe buffer allocation and optional fill.

**POLYGLOT**: Use the same allocation API across JavaScript, Python, Ruby, and Java with Elide!

Based on [buffer-alloc](https://www.npmjs.com/package/buffer-alloc) (~2M+ downloads/week)

## Features

- Safe buffer allocation
- Optional fill value (number, string, or buffer)
- Encoding support
- Zero dependencies

## Quick Start

```typescript
import bufferAlloc from './elide-buffer-alloc.ts';

// Empty buffer
const buf1 = bufferAlloc(10);

// Fill with number
const buf2 = bufferAlloc(10, 0x42);

// Fill with string
const buf3 = bufferAlloc(20, 'ABC');

// Fill with pattern
const pattern = new Uint8Array([0xDE, 0xAD, 0xBE, 0xEF]);
const buf4 = bufferAlloc(16, pattern);
```

## Use Cases

- Allocating initialized buffers
- Pre-filled buffer creation
- Safe memory allocation
- Binary data structures
