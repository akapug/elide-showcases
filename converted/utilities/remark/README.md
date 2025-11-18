# remark - Elide Polyglot Showcase

> **Markdown processing for ALL languages** - TypeScript, Python, Ruby, and Java

## Features

- Parse/stringify Markdown
- Plugin ecosystem
- Syntax tree manipulation
- **Polyglot**: Use from TypeScript, Python, Ruby, Java
- Zero dependencies

## Quick Start

```typescript
import remark from './elide-remark.ts';

const processor = remark();
const result = processor.process('# Hello');
console.log(result.value);
```

## Stats

- **npm downloads**: ~3M+/week
- **Elide advantage**: Markdown processing across all languages
