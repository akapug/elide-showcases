# filenamify - Elide Polyglot Showcase

> **Smart filename conversion for ALL languages** - TypeScript, Python, Ruby, and Java

## Features

- Convert any string to valid filename
- Intelligent character replacement
- Preserve file extensions
- Length limiting with smart truncation
- Cross-platform compatibility
- **~8M downloads/week on npm**

## Quick Start

```typescript
import filenamify from './elide-filenamify.ts';

// Basic conversion
filenamify('My: Document?.pdf');
// Result: 'My- Document.pdf'

// Custom options
filenamify('Long filename...', {
  replacement: '_',
  maxLength: 50
});

// Path handling
import { filenamifyPath } from './elide-filenamify.ts';
filenamifyPath('folder/sub:folder/file?.txt');
// Result: 'folder/sub-folder/file.txt'
```

## Character Replacements

- `:` → `-`
- `/` → `-`
- `\` → `-`
- `|` → `-`
- `<>?"*` → removed
- Control chars → removed
- Reserved names → prefixed with `!`

## API

- `filenamify(input, options?)` - Convert string to valid filename
- `filenamifyPath(path, options?)` - Convert path with multiple segments

## Links

- [Original npm package](https://www.npmjs.com/package/filenamify)

---

**Built with ❤️ for the Elide Polyglot Runtime**
