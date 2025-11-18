# np - Better npm Publish

A better npm publish with interactive UI and safety checks, implemented in pure TypeScript for Elide.

Based on https://www.npmjs.com/package/np (~50K+ downloads/week)

## Features

- Interactive version selection
- Pre-publish checks
- Git integration
- 2FA support
- Zero dependencies

## Quick Start

```typescript
import Np from "./elide-np.ts";

const np = new Np({ cleanup: true, tests: true });
await np.publish();
```

## Why Polyglot?

- **Safe publishing**: Checks before publish
- **Interactive**: User-friendly UI
- **Git integration**: Automatic tagging
