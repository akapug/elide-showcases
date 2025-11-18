# webpack-dashboard - Elide Polyglot Showcase

> **Build dashboards for ALL build systems**

## Features

- Real-time build status
- Module analysis
- Error/warning display
- **~100K+ downloads/week on npm**

## Quick Start

```typescript
import WebpackDashboard from './elide-webpack-dashboard.ts';

const dashboard = new WebpackDashboard();
dashboard.updateStats({ status: 'building', progress: 50 });
dashboard.render();
```

## Links

- [Original npm package](https://www.npmjs.com/package/webpack-dashboard)

---

**Built with ❤️ for the Elide Polyglot Runtime**
