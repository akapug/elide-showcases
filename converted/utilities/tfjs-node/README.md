# TensorFlow.js Node - Elide Polyglot Showcase

> **Native ML performance for ALL languages** - TypeScript, Python, Ruby, and Java

## Features

- Native C++ TensorFlow bindings
- GPU acceleration support
- High-performance tensor operations
- Production model serving
- **~150K downloads/week on npm**

## Quick Start

```typescript
import tfnode from './elide-tfjs-node.ts';

// High-performance tensors
const t = tfnode.tensor([1, 2, 3, 4]);

// Model serving
const server = new tfnode.ModelServer({
  modelPath: '/models/resnet50',
  useGpu: true
});

await server.load();
const prediction = server.predict(input);
```

## Links

- [Original npm package](https://www.npmjs.com/package/@tensorflow/tfjs-node)

---

**Built with ❤️ for the Elide Polyglot Runtime**
