# Detect Indent - Elide Polyglot Showcase

> **One indent detection library for ALL languages** - TypeScript, Python, Ruby, and Java

Detect the indentation style of code (spaces vs tabs, indent amount).

## Features

- Detects spaces vs tabs
- Detects indent amount (2, 4, etc.)
- Perfect for code formatters
- ~20M+ downloads/week on npm

## Quick Start

```typescript
import detectIndent from './elide-detect-indent.ts';

const code = `function test() {
  console.log("hello");
}`;

detectIndent(code);  // { amount: 2, type: 'space', indent: '  ' }
```

---

**Built with love for the Elide Polyglot Runtime**
