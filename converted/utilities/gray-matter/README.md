# gray-matter - Elide Polyglot Showcase

> **Front matter parsing for ALL languages** - TypeScript, Python, Ruby, and Java

## Features

- YAML/JSON/TOML front matter
- Markdown parsing
- Excerpts extraction
- **Polyglot**: Use from TypeScript, Python, Ruby, Java
- Zero dependencies

## Quick Start

```typescript
import matter from './elide-gray-matter.ts';

const file = `---
title: Hello
---
Content here`;

const result = matter(file);
console.log(result.data.title);
console.log(result.content);
```

## Stats

- **npm downloads**: ~5M+/week
- **Elide advantage**: Front matter parsing across all languages
