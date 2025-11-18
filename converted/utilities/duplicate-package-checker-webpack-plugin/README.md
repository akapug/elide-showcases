# duplicate-package-checker-webpack-plugin - Elide Polyglot Showcase

> **Dependency checking for ALL build systems**

## Features

- Detect duplicate packages
- Version comparison
- Bundle size impact
- **~100K+ downloads/week on npm**

## Quick Start

```typescript
import DuplicatePackageCheckerPlugin from './elide-duplicate-package-checker-webpack-plugin.ts';

const plugin = new DuplicatePackageCheckerPlugin({ verbose: true });
plugin.addPackage({ name: 'lodash', version: '4.17.21', path: 'node_modules/lodash' });
plugin.report();
```

## Links

- [Original npm package](https://www.npmjs.com/package/duplicate-package-checker-webpack-plugin)

---

**Built with ❤️ for the Elide Polyglot Runtime**
