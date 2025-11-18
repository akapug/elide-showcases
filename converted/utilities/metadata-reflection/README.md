# metadata-reflection - Elide Polyglot Showcase

> **Metadata reflection for ALL languages** - TypeScript, Python, Ruby, and Java

## Features

- Metadata storage
- Reflection queries
- Decorator support
- Type information
- **~100K+ downloads/week on npm**

## Quick Start

```typescript
import { MetadataReflection } from './elide-metadata-reflection.ts';

class User {
  name!: string;
}

MetadataReflection.define('role', 'admin', User);
console.log(MetadataReflection.get('role', User));
```

## Links

- [Original npm package](https://www.npmjs.com/package/metadata-reflection)

---

**Built with ❤️ for the Elide Polyglot Runtime**
