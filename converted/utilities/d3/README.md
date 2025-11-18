# D3 - Data-Driven Documents - Elide Polyglot Showcase

> **One D3 implementation for ALL languages** - TypeScript, Python, Ruby, and Java

The most popular data visualization library, now working across your entire polyglot stack.

## 🌟 Why This Matters

**Elide solves this** with ONE D3 implementation that works in ALL languages.

## ✨ Features

- ✅ Data selection and binding
- ✅ SVG generation
- ✅ Linear and band scales
- ✅ Line and arc generators
- ✅ Pie chart layouts
- ✅ Color scales
- ✅ **Polyglot**: Use from TypeScript, Python, Ruby, and Java
- ✅ Zero dependencies

## 🚀 Quick Start

### TypeScript

```typescript
import { scaleLinear, select, line } from './elide-d3.ts';

const scale = scaleLinear()
  .domain([0, 100])
  .range([0, 500]);

console.log(scale.call(50)); // 250
```

### Python

```python
from elide import require
d3 = require('./elide-d3.ts')

scale = d3.scaleLinear().domain([0, 100]).range([0, 500])
print(scale.call(50))  # 250
```

### Ruby

```ruby
d3 = Elide.require('./elide-d3.ts')

scale = d3.scaleLinear().domain([0, 100]).range([0, 500])
puts scale.call(50)  # 250
```

### Java

```java
Value d3 = context.eval("js", "require('./elide-d3.ts')");
Value scale = d3.getMember("scaleLinear")
  .execute()
  .invokeMember("domain", new int[]{0, 100})
  .invokeMember("range", new int[]{0, 500});
System.out.println(scale.invokeMember("call", 50).asInt());
```

## 📊 Use Cases

- Interactive dashboards
- Scientific data visualization
- Business intelligence charts
- Network graphs and hierarchies

## 📖 API Reference

### Scales

- `scaleLinear()` - Linear scale
- `scaleBand()` - Band scale for categorical data
- `scaleOrdinal()` - Ordinal color scale

### Shapes

- `line()` - Line path generator
- `arc()` - Arc path generator
- `pie()` - Pie chart layout

### Selection

- `select()` - Select single element
- `selectAll()` - Select multiple elements

### Array Utilities

- `max()`, `min()`, `extent()`, `range()`

## 📝 Package Stats

- **npm downloads**: ~10M/week
- **Use case**: Data visualization
- **Polyglot score**: Perfect for dashboards across languages

---

**Built with ❤️ for the Elide Polyglot Runtime**
