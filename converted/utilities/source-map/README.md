# source-map - Elide Polyglot Showcase

> **Source map generation and consumption for ALL languages** - TypeScript, Python, Ruby, and Java

## Features

- Generate source maps (V3 format)
- Parse and consume source maps
- Fast position mapping
- **150M+ downloads/week on npm**
- Merge multiple source maps
- Source content embedding

## Quick Start

```typescript
import { SourceMapGenerator, SourceMapConsumer } from './elide-source-map.ts';

// Generate
const generator = new SourceMapGenerator({ file: 'bundle.js' });
generator.addMapping({
  generated: { line: 1, column: 0 },
  original: { line: 1, column: 0 },
  source: 'app.ts',
});
const map = generator.toJSON();

// Consume
const consumer = new SourceMapConsumer(map);
const pos = consumer.originalPositionFor({ line: 1, column: 0 });
```

## Links

- [Original npm package](https://www.npmjs.com/package/source-map)

---

**Built with ❤️ for the Elide Polyglot Runtime**
