# semantic-release - Fully Automated Package Publishing

Fully automated version management and package publishing, implemented in pure TypeScript for Elide.

Based on https://www.npmjs.com/package/semantic-release (~500K+ downloads/week)

## Features

- Automated releases
- Version management
- Changelog generation
- CI/CD integration
- Zero dependencies

## Quick Start

```typescript
import SemanticRelease from "./elide-semantic-release.ts";

const sr = new SemanticRelease({ branches: ["main"] });
const release = await sr.release();
```

## Why Polyglot?

- **Fully automated**: No manual release process
- **CI/CD integration**: Seamless deployment
- **Version management**: Automatic semver
