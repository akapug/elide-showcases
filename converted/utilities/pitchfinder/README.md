# pitchfinder - Elide Polyglot Showcase

> **Pitch detection for ALL languages** - TypeScript, Python, Ruby, and Java

## Features

- YIN algorithm
- AMDF algorithm
- Autocorrelation
- Frequency to note conversion
- **~10K+ downloads/week on npm**

## Quick Start

```typescript
import { YIN, frequencyToNote } from './elide-pitchfinder.ts';

const detector = YIN.detector({ sampleRate: 44100 });
const buffer = new Float32Array(2048);
const frequency = detector(buffer);

if (frequency) {
  const { note, octave, cents } = frequencyToNote(frequency);
  console.log(`${note}${octave} (${cents}¢)`);
}
```

## Links

- [Original npm package](https://www.npmjs.com/package/pitchfinder)

---

**Built with ❤️ for the Elide Polyglot Runtime**
