# Detect Newline - Elide Polyglot Showcase

> **One newline detection library for ALL languages** - TypeScript, Python, Ruby, and Java

Detect the type of newline characters in text (LF, CRLF, or CR).

## Features

- Detects \n (Unix), \r\n (Windows), or \r (old Mac)
- Returns most common newline type
- ~20M+ downloads/week on npm

## Quick Start

```typescript
import detectNewline from './elide-detect-newline.ts';

detectNewline("hello\nworld");      // "\n" (Unix)
detectNewline("hello\r\nworld");    // "\r\n" (Windows)
```

---

**Built with love for the Elide Polyglot Runtime**
