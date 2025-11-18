# import-local - Import Local Version of Module

Import a locally installed version of a module over a global one, implemented in pure TypeScript for Elide.

Based on https://www.npmjs.com/package/import-local (~5M+ downloads/week)

## Features

- Prefer local modules
- Global fallback
- Path resolution
- CLI tools support
- Zero dependencies

## Quick Start

```typescript
import importLocal from "./elide-import-local.ts";

const localModule = importLocal("./my-module");
```

## Why Polyglot?

- **Local preference**: Use project-local modules
- **Global fallback**: Fall back to global when needed
- **CLI tools**: Essential for CLI tools
