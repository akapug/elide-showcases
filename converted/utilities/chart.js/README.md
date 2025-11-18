# Chart.js - Simple HTML5 Charts - Elide Polyglot Showcase

> **One Chart.js implementation for ALL languages** - TypeScript, Python, Ruby, and Java

Simple yet flexible charting library for all your visualization needs.

## ✨ Features

- ✅ Bar, line, pie, doughnut charts
- ✅ Responsive design
- ✅ Simple API
- ✅ **Polyglot**: Use from TypeScript, Python, Ruby, and Java
- ✅ Zero dependencies

## 🚀 Quick Start

### TypeScript

```typescript
import { createChart } from './elide-chart.js.ts';

const chart = createChart({
  type: 'bar',
  data: {
    labels: ['A', 'B', 'C'],
    datasets: [{ label: 'Values', data: [10, 20, 30] }]
  }
});

console.log(chart.toASCII());
```

## 📝 Package Stats

- **npm downloads**: ~5M/week
- **Use case**: Simple charts and dashboards

---

**Built with ❤️ for the Elide Polyglot Runtime**
