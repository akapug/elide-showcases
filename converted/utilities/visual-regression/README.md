# visual-regression - Elide Polyglot Showcase

> **Visual Regression Testing for ALL languages** - TypeScript, Python, Ruby, and Java

## Features

- Automated visual testing
- Screenshot comparison
- CI/CD integration
- **~300K downloads/week on npm**

## Quick Start

```typescript
import visualregression from './elide-visual-regression.ts';

const result = await visualRegression({
  baseline: 'baseline.png',
  current: 'current.png'
});
console.log('Passed:', result.passed);
```

## Links

- [Original npm package](https://www.npmjs.com/package/visual-regression)

---

**Built with ❤️ for the Elide Polyglot Runtime**
