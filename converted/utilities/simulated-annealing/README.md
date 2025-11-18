# simulated-annealing - Elide Polyglot Showcase

> **Simulated annealing for ALL languages** - TypeScript, Python, R, and Julia

## Features

- Global optimization
- Temperature scheduling
- **~3K downloads/week on npm**

## Quick Start

```typescript
import simulatedAnnealing from './elide-simulated-annealing.ts';

const energy = ([x]) => (x - 3) ** 2;
const neighbor = ([x]) => [x + (Math.random() - 0.5)];
simulatedAnnealing(energy, neighbor, [0]);
```

## Links

- [Original npm package](https://www.npmjs.com/package/simulated-annealing)

---

**Built with ❤️ for the Elide Polyglot Runtime**
