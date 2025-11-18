# TensorFlow.js - Elide Polyglot Showcase

> **Machine Learning for ALL languages** - TypeScript, Python, Ruby, and Java

## Features

- Neural network creation and training
- Tensor operations and transformations
- Activation functions (ReLU, Sigmoid, Softmax)
- Sequential model building
- **~300K downloads/week on npm**

## Quick Start

```typescript
import tf from './elide-tensorflow.ts';

// Create tensors
const t = tf.tensor([1, 2, 3, 4]);

// Build a model
const model = tf.sequential();
model.add(tf.layers.dense({ units: 128, activation: 'relu', inputShape: [784] }));
model.add(tf.layers.dense({ units: 10, activation: 'softmax' }));

model.compile({ loss: 'categoricalCrossentropy', optimizer: 'adam' });
model.summary();
```

## Links

- [Original npm package](https://www.npmjs.com/package/@tensorflow/tfjs)

---

**Built with ❤️ for the Elide Polyglot Runtime**
