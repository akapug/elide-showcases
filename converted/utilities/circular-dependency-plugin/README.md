# circular-dependency-plugin - Elide Polyglot Showcase

> **Dependency analysis for ALL build systems**

## Features

- Detect circular imports
- Dependency graph analysis
- Configurable detection
- **~300K+ downloads/week on npm**

## Quick Start

```typescript
import CircularDependencyPlugin from './elide-circular-dependency-plugin.ts';

const plugin = new CircularDependencyPlugin();
plugin.addDependency('moduleA', 'moduleB');
plugin.addDependency('moduleB', 'moduleA');
plugin.report();
```

## Links

- [Original npm package](https://www.npmjs.com/package/circular-dependency-plugin)

---

**Built with ❤️ for the Elide Polyglot Runtime**
