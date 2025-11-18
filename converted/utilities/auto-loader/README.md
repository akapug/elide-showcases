# Auto-Loader - Automatic Module Loading

Automatically load modules based on conventions.

Based on auto-loader concept (~20K+ downloads/week)

## Features

- Convention-based loading
- Auto-discovery
- Lazy loading
- Pattern matching

## Quick Start

```typescript
import AutoLoader from './elide-auto-loader.ts';

const loader = new AutoLoader();
const modules = loader.load('./controllers');
```
