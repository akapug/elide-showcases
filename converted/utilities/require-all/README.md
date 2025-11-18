# Require-All - Require All Modules in Directory

Require all modules from a directory at once.

Based on [require-all](https://www.npmjs.com/package/require-all) (~100K+ downloads/week)

## Features

- Require all files
- Recursive loading
- Filter patterns
- Custom naming

## Quick Start

```typescript
import requireAll from './elide-require-all.ts';

const modules = requireAll({
  dirname: './models',
  filter: /\.js$/,
  recursive: true
});
```
