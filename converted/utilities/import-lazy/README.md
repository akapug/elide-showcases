# import-lazy - Import Modules Lazily

Import modules lazily to speed up startup time, implemented in pure TypeScript for Elide.

Based on https://www.npmjs.com/package/import-lazy (~2M+ downloads/week)

## Features

- Lazy module loading
- Proxy-based access
- Startup optimization
- Memory efficient
- Zero dependencies

## Quick Start

```typescript
import importLazy from "./elide-import-lazy.ts";

const lodash = importLazy("lodash");
// Module is only loaded when first accessed
```

## Why Polyglot?

- **Startup optimization**: Faster boot time in any language
- **Memory efficient**: Load only what you need
- **Proxy-based**: Transparent lazy loading
