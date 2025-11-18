# npm-check-updates - Update Package Dependencies

Find newer versions of package dependencies and update package.json, implemented in pure TypeScript for Elide.

Based on https://www.npmjs.com/package/npm-check-updates (~300K+ downloads/week)

## Features

- Check for latest versions
- Update package.json
- Filter by package
- Respect version ranges
- Zero dependencies

## Quick Start

```typescript
import NCU, { checkUpdates, updatePackageJson } from "./elide-npm-check-updates.ts";

// Check for updates
const updates = await checkUpdates(dependencies, registry);

// Update package.json
const updated = updatePackageJson(packageJson, updates);

// Use NCU runner
const ncu = new NCU({ target: "latest" });
const allUpdates = await ncu.run(packageJson, registry);
const final = ncu.apply(packageJson, allUpdates);
```

## Polyglot Examples

### JavaScript/TypeScript
```typescript
const ncu = new NCU();
const updates = await ncu.run(pkg, registry);
```

### Python (via Elide)
```python
from elide_ncu import NCU
ncu = NCU()
updates = ncu.run(pkg, registry)
```

### Ruby (via Elide)
```ruby
require 'elide/ncu'
ncu = Elide::NCU.new
updates = ncu.run(pkg, registry)
```

## Why Polyglot?

- **Unified updates**: Check dependencies in any language
- **Consistent strategy**: Same update logic everywhere
- **Automated maintenance**: Keep all projects current
- **Security fixes**: Quick vulnerability patches
