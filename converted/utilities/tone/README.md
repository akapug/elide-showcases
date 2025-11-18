# tone - Elide Polyglot Showcase

> **Web audio framework for ALL languages** - TypeScript, Python, Ruby, and Java

## Features

- Synthesizers and instruments
- Audio effects and processing
- Transport and scheduling
- Music theory helpers
- **~150K+ downloads/week on npm**

## Quick Start

```typescript
import { Synth, Transport } from './elide-tone.ts';

const synth = new Synth().toDestination();

// Play a note
synth.triggerAttackRelease('C4', '8n');

// Start transport
Transport.bpmValue = 120;
Transport.start();
```

## Links

- [Original npm package](https://www.npmjs.com/package/tone)

---

**Built with ❤️ for the Elide Polyglot Runtime**
