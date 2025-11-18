# Normalize Newline - Elide Polyglot Showcase

> **One newline normalization library for ALL languages** - TypeScript, Python, Ruby, and Java

Convert all newline types to a consistent format.

## Features

- Normalize to \n (Unix) by default
- Configurable target newline
- Handles mixed newline types
- ~5M+ downloads/week on npm

## Quick Start

```typescript
import normalizeNewline from './elide-normalize-newline.ts';

normalizeNewline("hello\r\nworld");          // "hello\nworld"
normalizeNewline("hello\nworld", '\r\n');    // "hello\r\nworld"
```

---

**Built with love for the Elide Polyglot Runtime**
