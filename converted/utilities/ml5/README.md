# ML5.js - Elide Polyglot Showcase

> **Friendly ML for ALL languages** - TypeScript, Python, Ruby, and Java

## Features

- Image classification
- Pose estimation
- Style transfer
- Sentiment analysis
- **~30K downloads/week on npm**

## Quick Start

```typescript
import ml5 from './elide-ml5.ts';

const classifier = ml5.imageClassifier('MobileNet');
const results = await classifier.classify(image);

const sentiment = ml5.sentiment();
const result = sentiment.predict("This is amazing!");
```

## Links

- [Original npm package](https://www.npmjs.com/package/ml5)

---

**Built with ❤️ for the Elide Polyglot Runtime**
