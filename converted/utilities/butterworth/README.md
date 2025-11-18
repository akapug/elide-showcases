# butterworth - Elide Polyglot Showcase

> **Butterworth filter for ALL languages** - TypeScript, Python, R, and Julia

## Features

- Low-pass and high-pass filters
- Digital filter design
- **~5K downloads/week on npm**

## Quick Start

```typescript
import ButterworthFilter from './elide-butterworth.ts';

const filter = new ButterworthFilter(1, 1000, 8000, 'lowpass');
filter.processArray([1, -1, 1, -1]);
```

## Links

- [Original npm package](https://www.npmjs.com/package/butterworth)

---

**Built with ❤️ for the Elide Polyglot Runtime**
