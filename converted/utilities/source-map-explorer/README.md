# source-map-explorer - Elide Polyglot Showcase

> **Bundle analysis for ALL build systems**

## Features

- Source map analysis
- Bundle size breakdown
- File size attribution
- **~300K+ downloads/week on npm**

## Quick Start

```typescript
import SourceMapExplorer from './elide-source-map-explorer.ts';

const explorer = new SourceMapExplorer();
explorer.addBundle({
  file: 'bundle.js',
  sources: [{ file: 'src/app.js', size: 50000 }]
});
explorer.report('bundle.js');
```

## Links

- [Original npm package](https://www.npmjs.com/package/source-map-explorer)

---

**Built with ❤️ for the Elide Polyglot Runtime**
