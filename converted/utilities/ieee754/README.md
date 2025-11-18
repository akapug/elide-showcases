# ieee754 - IEEE 754 Floating Point

Read/write IEEE 754 floating point numbers from/to buffers.

Based on [ieee754](https://www.npmjs.com/package/ieee754) (~10M+ downloads/week)

## Quick Start

```typescript
import { read, write } from './elide-ieee754.ts';

const buf = new Uint8Array(4);
write(buf, 3.14, 0, true, 23, 4);
const value = read(buf, 0, true, 23, 4);
```
