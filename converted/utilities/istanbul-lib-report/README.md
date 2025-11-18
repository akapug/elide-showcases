# istanbul-lib-report - Elide Polyglot Showcase

> **Coverage report generation for ALL languages** - TypeScript, Python, Ruby, and Java

## Features

- Generate coverage reports in multiple formats
- HTML, JSON, LCOV, text, and more
- Summary statistics
- **80M+ downloads/week on npm**
- File grouping and filtering
- Customizable output

## Quick Start

```typescript
import { TextReport, HtmlReport, createContext } from './elide-istanbul-lib-report.ts';

const context = createContext({
  dir: './coverage',
  watermarks: {
    statements: [50, 80],
    lines: [50, 80],
  },
});

const report = new TextReport();
report.execute(context);

const htmlReport = new HtmlReport();
htmlReport.execute(context);
```

## Links

- [Original npm package](https://www.npmjs.com/package/istanbul-lib-report)

---

**Built with ❤️ for the Elide Polyglot Runtime**
