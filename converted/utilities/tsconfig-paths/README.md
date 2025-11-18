# tsconfig-paths - Elide Polyglot Showcase

> **TypeScript path mapping for ALL languages** - TypeScript, Python, Ruby, and Java

## Features

- Load path mappings from tsconfig.json
- Resolve module aliases at runtime
- Support for multiple base paths
- **15M+ downloads/week on npm**
- Node.js require() hook
- Webpack and Jest integration

## Quick Start

```typescript
import { register, createMatchPath, loadConfig } from './elide-tsconfig-paths.ts';

// Register path mappings
register({
  baseUrl: './src',
  paths: {
    '@/*': ['*'],
    '@utils/*': ['utils/*'],
  },
});

// Create resolver
const matchPath = createMatchPath('/project/src', {
  '@utils/*': ['utils/*'],
});

const resolved = matchPath('@utils/helpers');
console.log(resolved); // '/project/src/utils/helpers'
```

## Links

- [Original npm package](https://www.npmjs.com/package/tsconfig-paths)

---

**Built with ❤️ for the Elide Polyglot Runtime**
