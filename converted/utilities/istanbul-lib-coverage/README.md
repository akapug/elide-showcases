# istanbul-lib-coverage - Elide Polyglot Showcase

> **Code coverage data management for ALL languages** - TypeScript, Python, Ruby, and Java

## Features

- Manage code coverage data
- Line, branch, and function coverage
- Merge coverage from multiple runs
- **80M+ downloads/week on npm**
- Coverage summary generation
- Istanbul format support

## Quick Start

```typescript
import { createCoverageMap, createCoverageSummary } from './elide-istanbul-lib-coverage.ts';

// Create coverage map
const map = createCoverageMap();
map.addFileCoverage(fileCoverage);

// Merge coverage
map.merge(otherMap);

// Create summary
const summary = createCoverageSummary({
  lines: { total: 100, covered: 85, pct: 85 },
});
```

## Links

- [Original npm package](https://www.npmjs.com/package/istanbul-lib-coverage)

---

**Built with ❤️ for the Elide Polyglot Runtime**
