# Pad Left - Elide Polyglot Showcase

> **One string padding utility for ALL languages** - TypeScript, Python, Ruby, Java

Professional string padding for numbers, tables, and formatting that works across your entire polyglot stack.

## Features

- ✅ Left-pad to specified width
- ✅ Custom padding character
- ✅ Zero-padding helper (5 → 005)
- ✅ Right-pad and center-align
- ✅ **Polyglot**: TypeScript, Python, Ruby, Java
- ✅ Zero dependencies

## Quick Start

```typescript
import padLeft, { zeroPad, center } from './elide-pad-left.ts';

padLeft("5", 3, '0');             // "005"
zeroPad(42, 5);                   // "00042"
padRight("Name", 10);             // "Name      "
center("Title", 20, '-');         // "-------Title--------"
```

## Performance

~2M ops/sec - Perfect for high-volume formatting.

## Use Cases

- File naming (file001.jpg)
- Time formatting (09:05)
- Log line numbers
- Terminal tables
- Invoice alignment

## Files

- `elide-pad-left.ts` - Main implementation (215 lines)
- Language examples (Python, Ruby, Java)
- `benchmark.ts`, `CASE_STUDY.md`, `README.md`

**Total**: ~650 lines

## Package Stats

- **Use case**: File management, terminal output
- **Polyglot score**: 30/50 (C-Tier)

---

**Built with ❤️ for the Elide Polyglot Runtime**
