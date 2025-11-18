# Import-Modules - Import All Modules from Directory

Import all JavaScript/TypeScript modules from a directory.

Based on [import-modules](https://www.npmjs.com/package/import-modules) (~100K+ downloads/week)

## Features

- Import all modules
- Recursive scanning
- Pattern filtering
- Dynamic imports

## Quick Start

```typescript
import importModules from './elide-import-modules.ts';

const modules = await importModules('./plugins');
console.log(modules);
```
