# gradient-descent - Elide Polyglot Showcase

> **Gradient descent for ALL languages** - TypeScript, Python, R, and Julia

## Features

- Standard gradient descent
- Momentum support
- **~3K downloads/week on npm**

## Quick Start

```typescript
import gradientDescent from './elide-gradient-descent.ts';

const grad = ([x]) => [2 * (x - 5)];
gradientDescent(grad, [0], { learningRate: 0.1 });
```

## Links

- [Original npm package](https://www.npmjs.com/package/gradient-descent)

---

**Built with ❤️ for the Elide Polyglot Runtime**
