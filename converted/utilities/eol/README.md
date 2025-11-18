# EOL - Elide Polyglot Showcase

> **One line ending library for ALL languages** - TypeScript, Python, Ruby, and Java

Comprehensive line ending utilities for cross-platform text processing.

## Features

- Convert to LF, CRLF, or CR
- Split by any newline type
- Platform-specific defaults
- ~5M+ downloads/week on npm

## Quick Start

```typescript
import { lf, crlf, split } from './elide-eol.ts';

lf("hello\r\nworld");       // "hello\nworld"
crlf("hello\nworld");       // "hello\r\nworld"
split("a\nb\r\nc");         // ["a", "b", "c"]
```

---

**Built with love for the Elide Polyglot Runtime**
