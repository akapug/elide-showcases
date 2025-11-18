# istanbul-lib-source-maps - Elide Polyglot Showcase

> **Source map support for coverage for ALL languages** - TypeScript, Python, Ruby, and Java

## Features

- Map coverage data to original sources
- Source map integration for Istanbul
- Transform coverage across build steps
- **80M+ downloads/week on npm**
- Multi-level source map support
- Async loading and caching

## Quick Start

```typescript
import { createSourceMapStore } from './elide-istanbul-lib-source-maps.ts';

const store = createSourceMapStore({ verbose: true });

// Register source maps
store.registerMap('dist/app.js', sourceMap);

// Transform coverage
const transformed = store.transformCoverage(coverage);
console.log(transformed.map); // Coverage mapped to source files
```

## Links

- [Original npm package](https://www.npmjs.com/package/istanbul-lib-source-maps)

---

**Built with ❤️ for the Elide Polyglot Runtime**
