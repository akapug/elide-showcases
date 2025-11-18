# Brain.js - Elide Polyglot Showcase

> **Neural networks for ALL languages** - TypeScript, Python, Ruby, and Java

## Features

- Feed-forward neural networks
- LSTM recurrent networks
- Easy training API
- Network serialization
- **~100K downloads/week on npm**

## Quick Start

```typescript
import { NeuralNetwork } from './elide-brain.js.ts';

const net = new NeuralNetwork({ hiddenLayers: [3] });

net.train([
  { input: [0, 0], output: [0] },
  { input: [0, 1], output: [1] },
  { input: [1, 0], output: [1] },
  { input: [1, 1], output: [0] }
]);

const output = net.run([1, 0]); // ~[1]
```

## Links

- [Original npm package](https://www.npmjs.com/package/brain.js)

---

**Built with ❤️ for the Elide Polyglot Runtime**
