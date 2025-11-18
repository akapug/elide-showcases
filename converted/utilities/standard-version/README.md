# standard-version - Automated Versioning and Changelog

Automate versioning and CHANGELOG generation using semver and conventional commits, implemented in pure TypeScript for Elide.

Based on https://www.npmjs.com/package/standard-version (~200K+ downloads/week)

## Features

- Conventional commits
- Automatic versioning
- Changelog generation
- Git tagging
- Zero dependencies

## Quick Start

```typescript
import StandardVersion, { parseConventionalCommit, determineVersionBump } from "./elide-standard-version.ts";

const commit = parseConventionalCommit("feat: new feature");
const bump = determineVersionBump([commit]);

const sv = new StandardVersion();
await sv.bump(bump);
```

## Why Polyglot?

- **Automated versioning**: Consistent across all languages
- **Conventional commits**: Standard commit format
- **Changelog generation**: Automatic documentation
