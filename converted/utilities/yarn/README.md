# Yarn - Fast, Reliable Package Manager

Fast, reliable, and secure dependency management, implemented in pure TypeScript for Elide.

Based on https://www.npmjs.com/package/yarn (~3M+ downloads/week)

## Features

- Fast parallel installation
- Yarn.lock for deterministic installs
- Workspaces support
- Offline mode
- Zero dependencies

## Quick Start

```typescript
import Yarn, { parseYarnLock, parseWorkspaces } from "./elide-yarn.ts";

// Parse yarn.lock
const lock = parseYarnLock(lockContent);
console.log(lock);

// Parse workspaces
const workspaces = parseWorkspaces(packageJson);
console.log(workspaces.packages);

// Use Yarn runner
const yarn = new Yarn();
await yarn.install();
await yarn.add(["react", "react-dom"]);
```

## Polyglot Examples

### JavaScript/TypeScript
```typescript
const yarn = new Yarn();
await yarn.install();
```

### Python (via Elide)
```python
from elide_yarn import Yarn
yarn = Yarn()
yarn.install()
```

### Ruby (via Elide)
```ruby
require 'elide/yarn'
yarn = Elide::Yarn.new
yarn.install
```

## Why Polyglot?

- **Fast installation**: Parallel downloads in any language
- **Deterministic builds**: Same lockfile logic everywhere
- **Workspace support**: Manage monorepos across languages
- **Offline mode**: Work without internet connection
