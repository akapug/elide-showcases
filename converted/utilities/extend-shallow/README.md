# Extend Shallow - Elide Polyglot Showcase

> **One object extension implementation for ALL languages** - TypeScript, Python, Ruby, and Java

Extend objects with shallow copying across your entire polyglot stack.

## Features

- ✅ Shallow property copying
- ✅ Multiple object merging
- ✅ Custom merge functions
- ✅ Defaults (no overwrite)
- ✅ Symbol support
- ✅ **Polyglot**: Works across all languages
- ✅ Zero dependencies

## Quick Start

```typescript
import extend, { defaults } from './elide-extend-shallow.ts';

// Options merging
const options = extend(defaultOptions, userOptions);

// Defaults (don't overwrite)
const config = defaults(partial, fallback);
```

## Use Cases

- ✅ Options merging
- ✅ Configuration extension
- ✅ Plugin settings
- ✅ Default values
- ✅ Object composition

## Files

- `elide-extend-shallow.ts` - Main implementation
- `elide-extend-shallow.py` - Python integration
- `elide-extend-shallow.rb` - Ruby integration
- `ElideExtendShallowExample.java` - Java integration
- `benchmark.ts` - Performance comparison
- `CASE_STUDY.md` - Real-world story
- `README.md` - This file

## Package Stats

- **npm downloads**: ~8M/week
- **Use case**: Options, configuration
- **Polyglot score**: 30/50 (C-Tier)

---

**Built with ❤️ for the Elide Polyglot Runtime**
