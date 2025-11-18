# valid-filename - Validate Filenames - Elide Polyglot Showcase

> **One filename validator for ALL languages**

Check if a string is a valid filename on the current platform.

## 🚀 Quick Start

```typescript
import validFilename from './elide-valid-filename.ts';

// Valid filenames
validFilename('document.txt');        // true
validFilename('my-file.json');        // true

// Invalid characters
validFilename('file<name>.txt');      // false
validFilename('file|name.txt');       // false

// Reserved names (Windows)
validFilename('CON', { platform: 'win32' });  // false
validFilename('PRN', { platform: 'win32' });  // false

// Special cases
validFilename('.');                   // false
validFilename('..');                  // false
validFilename('.gitignore');          // true
```

## 📖 Validation Rules

- **Length**: 1-255 characters
- **Unix**: No null characters (`\0`)
- **Windows**: No `<>:"/\|?*` or control characters
- **Windows Reserved**: `CON`, `PRN`, `AUX`, `NUL`, `COM1-9`, `LPT1-9`
- **Not allowed**: `.` or `..`

## 📝 Stats

- **npm downloads**: ~50K+/week
- **Cross-platform validation**

---

**Built with ❤️ for the Elide Polyglot Runtime**
