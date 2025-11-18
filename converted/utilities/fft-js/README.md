# fft-js - Elide Polyglot Showcase

> **FFT library for ALL languages** - TypeScript, Python, Ruby, and Java

## Features

- FFT and inverse FFT
- Magnitude and phase extraction
- Frequency bin calculation
- Simple API
- **~20K downloads/week on npm**

## Quick Start

```typescript
import { fft, magnitude, frequencies } from './elide-fft-js.ts';

const signal = [1, 1, 1, 1, 0, 0, 0, 0];
const result = fft(signal);
const mag = magnitude(result);
const freqs = frequencies(result, 8000);
```

## Links

- [Original npm package](https://www.npmjs.com/package/fft-js)

---

**Built with ❤️ for the Elide Polyglot Runtime**
