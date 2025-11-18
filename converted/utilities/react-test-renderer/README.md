# react-test-renderer - Elide Polyglot Showcase

> **One React renderer for ALL languages** - TypeScript, Python, Ruby, and Java

React package for snapshot testing.

## Features

- Render React components to JSON
- Snapshot testing
- Test without DOM
- Component tree inspection
- Zero dependencies
- **~3M downloads/week on npm**

## Quick Start

```typescript
import { create } from './elide-react-test-renderer.ts';

const renderer = create(<MyComponent />);
const tree = renderer.toJSON();
expect(tree).toMatchSnapshot();
```

## Links

- [Original npm package](https://www.npmjs.com/package/react-test-renderer)

---

**Built with ❤️ for the Elide Polyglot Runtime**
