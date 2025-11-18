# Require-Glob - Require with Glob Patterns

Require modules using glob patterns.

Based on [require-glob](https://www.npmjs.com/package/require-glob) (~20K+ downloads/week)

## Features

- Glob pattern support
- Multiple patterns
- Exclude patterns
- Custom base path

## Quick Start

```typescript
import requireGlob from './elide-require-glob.ts';

const modules = requireGlob('**/*.js');
const filtered = requireGlob(['**/*.js', '!**/*.test.js']);
```
