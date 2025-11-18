# wavelets - Elide Polyglot Showcase

> **Wavelet transform for ALL languages** - TypeScript, Python, R, and Julia

## Features

- Haar wavelet transform
- Forward and inverse DWT
- Multi-resolution analysis
- **~5K downloads/week on npm**

## Quick Start

```typescript
import { haarTransform, inverseHaarTransform, dwt } from './elide-wavelets.ts';

const signal = [1, 2, 3, 4];
const { approx, detail } = haarTransform(signal);
const reconstructed = inverseHaarTransform(approx, detail);
```

## Links

- [Original npm package](https://www.npmjs.com/package/wavelets)

---

**Built with ❤️ for the Elide Polyglot Runtime**
