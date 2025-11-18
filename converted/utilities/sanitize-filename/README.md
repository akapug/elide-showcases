# sanitize-filename - Elide Polyglot Showcase

> **Filename sanitization for ALL languages** - TypeScript, Python, Ruby, and Java

## Features

- Remove illegal filesystem characters
- Handle reserved names (CON, PRN, AUX, etc.)
- Truncate long filenames (255 byte limit)
- Cross-platform compatibility (Windows, Linux, macOS)
- **~5M downloads/week on npm**

## Quick Start

```typescript
import sanitize from './elide-sanitize-filename.ts';

// Basic sanitization
sanitize('my file?.txt');
// Result: 'my file.txt'

// Windows reserved names
sanitize('con.txt');
// Result: ''

// Custom replacement
sanitize('file/with/slashes.txt', { replacement: '-' });
// Result: 'file-with-slashes.txt'
```

## Removed Characters

- Illegal chars: `/ ? < > \ : * | "`
- Control chars: `\x00-\x1f\x80-\x9f`
- Reserved names: `.`, `..`, `CON`, `PRN`, `AUX`, `NUL`, `COM1-9`, `LPT1-9`
- Trailing dots and spaces (Windows)

## Links

- [Original npm package](https://www.npmjs.com/package/sanitize-filename)

---

**Built with ❤️ for the Elide Polyglot Runtime**
