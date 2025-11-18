# Requireindex - Auto-Require Directory Index

Automatically require an entire directory and export as index.

Based on [requireindex](https://www.npmjs.com/package/requireindex) (~100K+ downloads/week)

## Features

- Auto-index creation
- Directory scanning
- Recursive support
- Clean exports

## Quick Start

```typescript
import requireindex from './elide-requireindex.ts';

// Create an index of all modules in directory
const modules = requireindex('./lib');
export default modules;
```
