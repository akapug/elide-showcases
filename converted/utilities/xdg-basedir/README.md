# xdg-basedir - XDG Base Directory Specification

Get XDG Base Directory paths for config, data, cache, etc.

Based on [xdg-basedir](https://www.npmjs.com/package/xdg-basedir) (~1M+ downloads/week)

## Features

- XDG Base Directory Specification compliance
- Config, data, cache, runtime directories
- Cross-platform defaults
- Zero dependencies

## Quick Start

```typescript
import xdg from './elide-xdg-basedir.ts';

console.log(xdg.config);   // ~/.config
console.log(xdg.data);     // ~/.local/share
console.log(xdg.cache);    // ~/.cache
console.log(xdg.runtime);  // /run/user/1000
```

## POLYGLOT Benefits

Use the same xdg-basedir library in:
- **JavaScript/TypeScript** - Native Elide support
- **Python** - Via Elide's polyglot runtime
- **Ruby** - Via Elide's polyglot runtime
- **Java** - Via Elide's polyglot runtime

~1M+ downloads/week on npm
