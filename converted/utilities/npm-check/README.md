# npm-check - Check Package Status

Check for outdated, incorrect, and unused dependencies, implemented in pure TypeScript for Elide.

Based on https://www.npmjs.com/package/npm-check (~50K+ downloads/week)

## Features

- Find outdated packages
- Detect unused dependencies
- Check for missing packages
- Interactive updates
- Zero dependencies

## Quick Start

```typescript
import NpmCheck, { checkPackages, isPackageUsed } from "./elide-npm-check.ts";

// Check if package is used
const used = isPackageUsed("react", sourceFiles);

// Check all packages
const results = await checkPackages(packageJson, installed, registry, sourceFiles);

// Use npm-check runner
const checker = new NpmCheck();
const statuses = await checker.check(packageJson, installed, registry, sourceFiles);
console.log(checker.summary(statuses));
```

## Polyglot Examples

### JavaScript/TypeScript
```typescript
const checker = new NpmCheck();
const results = await checker.check(pkg, installed, registry, sources);
```

### Python (via Elide)
```python
from elide_npm_check import NpmCheck
checker = NpmCheck()
results = checker.check(pkg, installed, registry, sources)
```

### Ruby (via Elide)
```ruby
require 'elide/npm_check'
checker = Elide::NpmCheck.new
results = checker.check(pkg, installed, registry, sources)
```

## Why Polyglot?

- **Health monitoring**: Check dependencies in any language
- **Unused detection**: Find dead dependencies anywhere
- **Bundle optimization**: Reduce size across all projects
- **Consistent auditing**: Same health checks everywhere
