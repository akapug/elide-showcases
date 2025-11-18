# resolve-cwd - Resolve Module from CWD

Resolve the path of a module like require.resolve() but from the current working directory, implemented in pure TypeScript for Elide.

Based on https://www.npmjs.com/package/resolve-cwd (~2M+ downloads/week)

## Features

- Resolve from CWD
- Module path resolution
- Require.resolve alternative
- Cross-platform support
- Zero dependencies

## Quick Start

```typescript
import resolveCwd from "./elide-resolve-cwd.ts";

const path = resolveCwd("lodash");
console.log(path);
```

## Why Polyglot?

- **CWD resolution**: Resolve from current directory
- **Module paths**: Find modules efficiently
- **Cross-platform**: Works everywhere
