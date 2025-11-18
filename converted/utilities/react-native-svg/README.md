# React Native SVG - Elide Polyglot Showcase

> **One SVG library for ALL languages** - TypeScript, Python, Ruby, and Java

SVG library for React Native with full SVG support.

## Features

- Full SVG specification
- Path, Circle, Rect, Polygon, Line
- Gradients and patterns
- Transformations
- Animations
- **~2M downloads/week on npm**

## Quick Start

```typescript
import { Svg, Circle, Rect, Path } from './elide-react-native-svg.ts';

const svg = new Svg({ width: 200, height: 200 });
const circle = new Circle({ cx: 100, cy: 100, r: 50, fill: '#FF6B6B' });
console.log(circle.render());
```

## Documentation

Run the demo:

```bash
elide run elide-react-native-svg.ts
```

## Links

- [Original npm package](https://www.npmjs.com/package/react-native-svg)
- [React Native SVG Docs](https://github.com/software-mansion/react-native-svg)

---

**Built with ❤️ for the Elide Polyglot Runtime**
