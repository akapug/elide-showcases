# resemblejs - Elide Polyglot Showcase

> **Image Analysis and Comparison for ALL languages** - TypeScript, Python, Ruby, and Java

## Features

- Visual regression testing
- Similarity scoring
- Diff output
- **~1M downloads/week on npm**

## Quick Start

```typescript
import resemblejs from './elide-resemblejs.ts';

resemble('image1.jpg')
  .compareTo('image2.jpg')
  .onComplete(data => {
    console.log('Mismatch:', data.mismatchPercentage + '%');
  });
```

## Links

- [Original npm package](https://www.npmjs.com/package/resemblejs)

---

**Built with ❤️ for the Elide Polyglot Runtime**
