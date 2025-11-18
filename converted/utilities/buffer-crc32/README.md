# buffer-crc32 - CRC32 Checksums

Fast CRC32 checksum calculation for data integrity verification.

Based on [buffer-crc32](https://www.npmjs.com/package/buffer-crc32) (~2M+ downloads/week)

## Quick Start

```typescript
import crc32 from './elide-buffer-crc32.ts';

const checksum = crc32('Hello, World!');
console.log(checksum.toString(16));

// Incremental
const crc1 = crc32('Hello');
const crc2 = crc32(', World!', crc1);
```

## Use Cases

- File integrity checks
- ZIP file format
- Network protocols
- Data validation
