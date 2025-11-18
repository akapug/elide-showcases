# dsp.js - Elide Polyglot Showcase

> **Digital signal processing for ALL languages** - TypeScript, Python, Ruby, and Java

## Features

- Window functions (Hamming, Hann, Blackman)
- Oscillators (sine, square, sawtooth)
- Digital filters (low-pass, high-pass)
- Signal analysis tools
- **~10K downloads/week on npm**

## Quick Start

```typescript
import { window, Oscillator, LowPassFilter } from './elide-dsp.js.ts';

// Generate tone
const osc = new Oscillator(8000, 440);
const tone = osc.sine(100);

// Apply filter
const lpf = new LowPassFilter(1000, 8000);
const filtered = lpf.processArray(tone);

// Window function
const win = window.hamming(64);
```

## Links

- [Original npm package](https://www.npmjs.com/package/dsp.js)

---

**Built with ❤️ for the Elide Polyglot Runtime**
