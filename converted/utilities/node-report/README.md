# node-report - Elide Polyglot Showcase

> **Diagnostic reports for ALL languages** - TypeScript, Python, Ruby, and Java

## Features

- Diagnostic report generation
- Memory usage analysis
- Stack traces
- Environment information
- **~10K downloads/week on npm**

## Quick Start

```typescript
import NodeReport from './elide-node-report.ts';

NodeReport.setEvents(['exception', 'signal']);
const filename = NodeReport.triggerReport();
const report = NodeReport.getReport();
```

## Links

- [Original npm package](https://www.npmjs.com/package/node-report)

---

**Built with ❤️ for the Elide Polyglot Runtime**
