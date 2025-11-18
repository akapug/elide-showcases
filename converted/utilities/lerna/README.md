# Lerna - Monorepo Management Tool

Manage JavaScript projects with multiple packages, implemented in pure TypeScript for Elide.

Based on https://www.npmjs.com/package/lerna (~500K+ downloads/week)

## Features

- Multi-package management
- Versioning and publishing
- Dependency linking
- Change detection
- Zero dependencies

## Quick Start

```typescript
import Lerna, { parseLernaConfig, buildDependencyGraph } from "./elide-lerna.ts";

// Parse configuration
const config = parseLernaConfig(lernaJson);

// Build dependency graph
const graph = buildDependencyGraph(packages);

// Use Lerna runner
const lerna = new Lerna(config);
await lerna.bootstrap();
await lerna.run("build");
await lerna.publish();
```

## Polyglot Examples

### JavaScript/TypeScript
```typescript
const lerna = new Lerna(config);
await lerna.bootstrap();
```

### Python (via Elide)
```python
from elide_lerna import Lerna
lerna = Lerna(config)
lerna.bootstrap()
```

### Ruby (via Elide)
```ruby
require 'elide/lerna'
lerna = Elide::Lerna.new(config)
lerna.bootstrap
```

## Why Polyglot?

- **Monorepo management**: Handle multiple packages in any language
- **Coordinated releases**: Version and publish together
- **Dependency linking**: Link local packages efficiently
- **Build orchestration**: Run commands across packages
