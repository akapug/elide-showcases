# fft.js - Elide Polyglot Showcase

> **High-performance FFT for ALL languages** - TypeScript, Python, Ruby, and Java

## Features

- Radix-2 and Radix-4 algorithms
- Real and complex transforms
- Table-based optimization
- Inverse transforms
- **~50K downloads/week on npm**

## Quick Start

```typescript
import FFT from './elide-fft.js.ts';

const size = 8;
const fft = new FFT(size);

const signal = [1, 1, 1, 1, 0, 0, 0, 0];
const out = new Array(size * 2);

fft.realTransform(out, signal);
const magnitude = FFT.magnitude(out);
```

## Links

- [Original npm package](https://www.npmjs.com/package/fft.js)

---

**Built with ❤️ for the Elide Polyglot Runtime**
