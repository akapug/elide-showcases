# callsites - Get Call Sites

Get call sites from the V8 stack trace API, implemented in pure TypeScript for Elide.

Based on https://www.npmjs.com/package/callsites (~5M+ downloads/week)

## Features

- Get call stack
- Stack trace API
- Caller information
- Debug support
- Zero dependencies

## Quick Start

```typescript
import callsites from "./elide-callsites.ts";

const sites = callsites();
console.log(sites[0].getFileName());
```

## Why Polyglot?

- **Stack traces**: Get call stacks in any language
- **Debug support**: Essential debugging info
- **Caller detection**: Find who called your code
