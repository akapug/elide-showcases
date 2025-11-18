# npm - Package Manager

The world's largest software registry and package manager for JavaScript, implemented in pure TypeScript for Elide.

Based on https://www.npmjs.com/package/npm (~5M+ downloads/week)

## Features

- Package installation and management
- Dependency resolution
- Semantic versioning
- Package.json parsing
- Script execution
- Zero dependencies

## Quick Start

```typescript
import NPM, { parsePackageJson, validatePackageName, satisfiesVersion } from "./elide-npm.ts";

// Parse package.json
const pkg = parsePackageJson(packageJsonString);
console.log(pkg.name, pkg.version);

// Validate package name
const result = validatePackageName("my-package");
console.log(result.valid); // true

// Check version satisfaction
const satisfies = satisfiesVersion("1.2.5", "^1.2.0");
console.log(satisfies); // true

// Use NPM runner
const npm = new NPM();
await npm.install(["express", "lodash"]);
await npm.runScript("start", pkg);
```

## Polyglot Examples

### JavaScript/TypeScript
```typescript
const pkg = parsePackageJson(content);
console.log(`${pkg.name}@${pkg.version}`);
```

### Python (via Elide)
```python
from elide_npm import parse_package_json
pkg = parse_package_json(content)
print(f"{pkg['name']}@{pkg['version']}")
```

### Ruby (via Elide)
```ruby
require 'elide/npm'
pkg = Elide::NPM.parse_package_json(content)
puts "#{pkg[:name]}@#{pkg[:version]}"
```

## Why Polyglot?

- **One package manager**: Use npm interface across all languages
- **Consistent versioning**: Same semver logic everywhere
- **Shared parsing**: Parse package.json in any language
- **Universal tooling**: Build dev tools that work across languages
