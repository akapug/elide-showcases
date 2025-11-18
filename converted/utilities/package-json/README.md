# package-json - Get Package Metadata

Get metadata of a package from the npm registry, implemented in pure TypeScript for Elide.

Based on https://www.npmjs.com/package/package-json (~500K+ downloads/week)

## Features

- Fetch package metadata
- Version resolution
- Registry support
- Caching
- Zero dependencies

## Quick Start

```typescript
import packageJson from "./elide-package-json.ts";

const metadata = await packageJson("react", { version: "18.2.0" });
console.log(metadata);
```

## Why Polyglot?

- **Metadata access**: Get package info in any language
- **Version resolution**: Find package versions
- **Registry support**: Multiple registry support
