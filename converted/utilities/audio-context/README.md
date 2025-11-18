# audio-context - Elide Polyglot Showcase

> **Web Audio API for ALL languages** - TypeScript, Python, Ruby, and Java

## Features

- AudioContext creation
- Cross-platform compatibility
- Audio processing graph
- **~40K+ downloads/week on npm**

## Quick Start

```typescript
import AudioContext from './elide-audio-context.ts';

const ctx = new AudioContext({ sampleRate: 44100 });
const osc = ctx.createOscillator();
osc.connect(ctx.destination);
osc.start();
```

## Links

- [Original npm package](https://www.npmjs.com/package/audio-context)

---

**Built with ❤️ for the Elide Polyglot Runtime**
