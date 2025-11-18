# release-it - Interactive Release Tool

Generic CLI tool to automate versioning and package publishing, implemented in pure TypeScript for Elide.

Based on https://www.npmjs.com/package/release-it (~200K+ downloads/week)

## Features

- Interactive CLI
- Git operations
- npm publishing
- Changelog generation
- Zero dependencies

## Quick Start

```typescript
import ReleaseIt from "./elide-release-it.ts";

const releaseIt = new ReleaseIt(config);
await releaseIt.release("minor");
```

## Why Polyglot?

- **Interactive**: User-friendly release process
- **Git integration**: Automatic commits and tags
- **Publishing**: Publish to multiple registries
