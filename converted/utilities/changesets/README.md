# Changesets - Version and Changelog Management

Manage versions, changelogs, and publishing for multi-package repositories, implemented in pure TypeScript for Elide.

Based on https://www.npmjs.com/package/@changesets/cli (~500K+ downloads/week)

## Features

- Version bumping
- Changelog generation
- Multi-package coordination
- Git integration
- Zero dependencies

## Quick Start

```typescript
import Changesets, { bumpVersion } from "./elide-changesets.ts";

const newVersion = bumpVersion("1.0.0", "minor");

const changesets = new Changesets();
await changesets.add("New feature", releases);
await changesets.version();
```

## Why Polyglot?

- **Version management**: Coordinate versions across languages
- **Changelog generation**: Consistent changelogs everywhere
- **Release coordination**: Multi-package releases
