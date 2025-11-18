# resolve-pkg - Resolve Package Path

Resolve the path of a package regardless of it having an entry point, implemented in pure TypeScript for Elide.

Based on https://www.npmjs.com/package/resolve-pkg (~100K+ downloads/week)

## Features

- Resolve package paths
- No entry point required
- Node modules traversal
- Cache support
- Zero dependencies

## Quick Start

```typescript
import resolvePkg from "./elide-resolve-pkg.ts";

const path = resolvePkg("react");
console.log(path);
```

## Why Polyglot?

- **Package resolution**: Find packages in any language
- **No entry point**: Resolve without knowing entry
- **Module traversal**: Search node_modules efficiently
