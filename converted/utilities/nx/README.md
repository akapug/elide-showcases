# Nx - Smart Monorepo Build System

Next generation build system with first class monorepo support, implemented in pure TypeScript for Elide.

Based on https://www.npmjs.com/package/nx (~1M+ downloads/week)

## Features

- Computation caching
- Smart rebuilds
- Distributed task execution
- Code generation
- Zero dependencies

## Quick Start

```typescript
import Nx, { calculateAffected } from "./elide-nx.ts";

const affected = calculateAffected(changedFiles, projects);
const nx = new Nx(config);
await nx.run("app", "build");
await nx.affected("test");
```

## Why Polyglot?

- **Smart caching**: Cache builds in any language
- **Incremental builds**: Only rebuild what changed
- **Distributed execution**: Parallel builds across languages
- **Build optimization**: Fast CI/CD everywhere
