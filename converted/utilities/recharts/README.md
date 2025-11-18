# Recharts - React Charts - Elide Polyglot Showcase

> **One Recharts implementation for ALL languages** - TypeScript, Python, Ruby, and Java

Composable charting library for React-style data visualization.

## ✨ Features

- ✅ Line, bar, area, pie charts
- ✅ Composable components
- ✅ Responsive design
- ✅ **Polyglot**: Use from TypeScript, Python, Ruby, and Java
- ✅ Zero dependencies

## 🚀 Quick Start

### TypeScript

```typescript
import { createLineChart } from './elide-recharts.ts';

const data = [
  { name: 'Jan', value: 400 },
  { name: 'Feb', value: 300 }
];

const chart = createLineChart(data);
chart.addLine({ dataKey: 'value' });
console.log(chart.render());
```

## 📝 Package Stats

- **npm downloads**: ~3M/week
- **Use case**: React data visualization

---

**Built with ❤️ for the Elide Polyglot Runtime**
