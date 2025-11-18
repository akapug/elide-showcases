# write-pkg - Elide Polyglot Showcase

> **Write package.json for ALL languages**

Write package.json with proper formatting and normalization.

## Features

- Write formatted package.json
- Field normalization
- Custom indentation
- Custom CWD
- **Polyglot**: TypeScript, Python, Ruby, Java
- Zero dependencies

## Quick Start

```typescript
import { writePkg } from './elide-write-pkg.ts';

// Write package.json
await writePkg({
  name: 'my-package',
  version: '1.0.0',
  description: 'My awesome package'
});

// Custom indent
await writePkg(pkg, { indent: 4 });

// Custom directory
await writePkg(pkg, { cwd: './packages/foo' });

// Sync version
writePkgSync(pkg);
```

## Stats

- **npm downloads**: ~15M/week
- **Use case**: Project scaffolding, package updates
