# istanbul-lib-instrument - Elide Polyglot Showcase

> **Code instrumentation for coverage for ALL languages** - TypeScript, Python, Ruby, and Java

## Features

- Instrument code for coverage tracking
- Babel-based AST transformation
- Source map support
- **80M+ downloads/week on npm**
- Multiple instrumentation strategies
- TypeScript support

## Quick Start

```typescript
import { createInstrumenter } from './elide-istanbul-lib-instrument.ts';

const instrumenter = createInstrumenter({
  coverageVariable: '__coverage__',
  produceSourceMap: true,
});

const result = instrumenter.instrument(code, 'app.js');
console.log(result.code); // Instrumented code
console.log(result.coverageData);
```

## Links

- [Original npm package](https://www.npmjs.com/package/istanbul-lib-instrument)

---

**Built with ❤️ for the Elide Polyglot Runtime**
