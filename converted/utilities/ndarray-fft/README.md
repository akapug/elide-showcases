# ndarray-fft - Elide Polyglot Showcase

> **Fast Fourier Transform for ALL languages** - TypeScript, Python, MATLAB, and R

## Features

- 1D FFT and inverse FFT
- Cooley-Tukey radix-2 algorithm
- Complex number support
- Magnitude spectrum
- **~20K downloads/week on npm**

## Quick Start

```typescript
import { fft, ifft, rfft, magnitude, Complex } from './elide-ndarray-fft.ts';

// FFT of real signal
const signal = [1, 1, 1, 1, 0, 0, 0, 0];
const result = rfft(signal);
const mag = magnitude(result);

// Inverse FFT
const reconstructed = ifft(result);
```

## Links

- [Original npm package](https://www.npmjs.com/package/ndarray-fft)

---

**Built with ❤️ for the Elide Polyglot Runtime**
