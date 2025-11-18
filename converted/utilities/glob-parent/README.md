# glob-parent - Elide Polyglot Showcase

> **Extract parent directory from glob for ALL languages**

Extract the non-glob parent path from a glob string.

## Features

- Extract base directory
- Handle absolute paths
- Detect glob boundaries
- **Polyglot**: TypeScript, Python, Ruby, Java
- Zero dependencies

## Quick Start

```typescript
import globParent from './elide-glob-parent.ts';

globParent('*.ts');               // "."
globParent('src/*.ts');           // "src"
globParent('src/**/*.ts');        // "src"
globParent('a/b/c/*.ts');         // "a/b/c"
globParent('/abs/path/*.ts');     // "/abs/path"
globParent('foo/{a,b}.ts');       // "foo"
globParent('**/*.ts');            // "."
globParent('/abs/**/*.ts');       // "/abs"
```

## Stats

- **npm downloads**: ~150M/week
- **Use case**: Glob base detection, file watchers
