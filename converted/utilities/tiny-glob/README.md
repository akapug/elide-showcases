# tiny-glob - Elide Polyglot Showcase

> **Tiny fast glob matcher for ALL languages**

Lightweight glob matching with minimal footprint for simple patterns.

## Features

- Minimal size
- Fast matching
- Simple API
- **Polyglot**: TypeScript, Python, Ruby, Java
- Zero dependencies

## Quick Start

```typescript
import tinyGlob from './elide-tiny-glob.ts';

const files = await tinyGlob('**/*.ts');
const absolute = await tinyGlob('*.ts', { absolute: true });
```

## Stats

- **npm downloads**: ~8M/week
- **Use case**: Simple file matching
