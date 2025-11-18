# import-cwd - Import Module from CWD

Import a module like require() but from the current working directory, implemented in pure TypeScript for Elide.

Based on https://www.npmjs.com/package/import-cwd (~500K+ downloads/week)

## Features

- Import from CWD
- Dynamic imports
- Path resolution
- Error handling
- Zero dependencies

## Quick Start

```typescript
import importCwd from "./elide-import-cwd.ts";

const module = importCwd("lodash");
```

## Why Polyglot?

- **CWD imports**: Import from current directory
- **Dynamic loading**: Load modules at runtime
- **Plugin systems**: Essential for plugins
