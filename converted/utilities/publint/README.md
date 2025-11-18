# publint - Lint Packaging Errors

Lint packaging errors in your package.json, implemented in pure TypeScript for Elide.

Based on https://www.npmjs.com/package/publint (~50K+ downloads/week)

## Features

- Package.json validation
- Export map checking
- File existence validation
- Best practices enforcement
- Zero dependencies

## Quick Start

```typescript
import Publint from "./elide-publint.ts";

const publint = new Publint();
const result = await publint.lint(packageJson);
console.log(publint.format(result));
```

## Why Polyglot?

- **Package validation**: Check packages in any language
- **Best practices**: Consistent standards everywhere
- **Export checking**: Validate module exports
