# particle-swarm - Elide Polyglot Showcase

> **Particle swarm optimization for ALL languages** - TypeScript, Python, R, and Julia

## Features

- Swarm-based optimization
- Global and local best tracking
- **~2K downloads/week on npm**

## Quick Start

```typescript
import particleSwarm from './elide-particle-swarm.ts';

const fitness = ([x]) => -(x - 3) ** 2;
particleSwarm(fitness, 1, { iterations: 50 });
```

## Links

- [Original npm package](https://www.npmjs.com/package/particle-swarm)

---

**Built with ❤️ for the Elide Polyglot Runtime**
