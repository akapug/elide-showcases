# clang-format - Elide Polyglot Showcase

> **C/C++/Java/JavaScript formatter for ALL languages** - TypeScript, Python, Ruby, and Java

## Features

- Format C, C++, Java, JavaScript, Protocol Buffers
- Multiple style presets (LLVM, Google, Chromium, Mozilla, WebKit)
- Highly configurable formatting
- **1M+ downloads/week on npm**
- Command-line tool integration
- Objective-C support

## Quick Start

```typescript
import { format, ClangFormat } from './elide-clang-format.ts';

// Simple formatting
const formatted = await format(cppCode, { style: 'Google' });

// Advanced usage
const formatter = new ClangFormat({ style: 'LLVM' });
const code = formatter.format(sourceCode, { language: 'cpp' });
```

## Links

- [Original npm package](https://www.npmjs.com/package/clang-format)

---

**Built with ❤️ for the Elide Polyglot Runtime**
