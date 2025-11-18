# hummus - Elide Polyglot Showcase

> **PDF manipulation for ALL languages** - TypeScript, Python, Ruby, and Java

## Features

- Create/modify PDFs
- Low-level control
- Fast processing
- **Polyglot**: Use from TypeScript, Python, Ruby, Java
- Zero dependencies

## Quick Start

```typescript
import { createWriter } from './elide-hummus.ts';

const writer = createWriter('output.pdf');
const page = writer.createPage(595, 842);
page.writeText('Hello!', 50, 50);
writer.end();
```

## Stats

- **npm downloads**: ~20K+/week
- **Elide advantage**: PDF manipulation across all languages
