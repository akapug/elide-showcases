# pnpm - Fast, Disk Space Efficient Package Manager

Fast, disk space efficient package manager with strict dependency resolution, implemented in pure TypeScript for Elide.

Based on https://www.npmjs.com/package/pnpm (~1M+ downloads/week)

## Features

- Content-addressable storage
- Strict dependency resolution
- Monorepo support
- Fast installation
- Zero dependencies

## Quick Start

```typescript
import PNPM, { calculateContentHash, checkPeerDependency } from "./elide-pnpm.ts";

// Calculate content hash
const hash = calculateContentHash(content);
const storePath = generateStorePath("react", "18.2.0", hash);

// Check peer dependencies
const result = checkPeerDependency("^16.0.0", "16.8.0");
console.log(result.compatible);

// Use pnpm runner
const pnpm = new PNPM();
await pnpm.install();
await pnpm.add(["react", "react-dom"]);
```

## Polyglot Examples

### JavaScript/TypeScript
```typescript
const pnpm = new PNPM();
await pnpm.install();
```

### Python (via Elide)
```python
from elide_pnpm import PNPM
pnpm = PNPM()
pnpm.install()
```

### Ruby (via Elide)
```ruby
require 'elide/pnpm'
pnpm = Elide::PNPM.new
pnpm.install
```

## Why Polyglot?

- **Disk efficient**: Save space across all language projects
- **Strict isolation**: Prevent phantom dependencies
- **Fast installs**: Quick setup in any language
- **Monorepo support**: Manage multiple packages efficiently
