# meyda - Elide Polyglot Showcase

> **Audio feature extraction for ALL languages** - TypeScript, Python, Ruby, and Java

## Features

- Extract RMS, ZCR, energy
- Spectral features (centroid, rolloff, flatness)
- MFCC coefficients
- Chroma features
- **~20K+ downloads/week on npm**

## Quick Start

```typescript
import Meyda from './elide-meyda.ts';

// Extract single feature
const rms = Meyda.extract('rms');

// Extract multiple features
const features = Meyda.extract(['rms', 'zcr', 'spectralCentroid']);
console.log(features.rms, features.zcr);
```

## Links

- [Original npm package](https://www.npmjs.com/package/meyda)

---

**Built with ❤️ for the Elide Polyglot Runtime**
