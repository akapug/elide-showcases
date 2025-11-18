# reflect-metadata - Elide Polyglot Showcase

> **Metadata Reflection API for ALL languages** - TypeScript, Python, Ruby, and Java

## Features

- Metadata definition and queries
- Decorator metadata support
- Design-time type information
- Property decorators
- **~5M+ downloads/week on npm**

## Quick Start

```typescript
import { Reflect } from './elide-reflect-metadata.ts';

class User {
  name!: string;
}

Reflect.defineMetadata('role', 'admin', User);
console.log(Reflect.getMetadata('role', User)); // 'admin'
```

## Links

- [Original npm package](https://www.npmjs.com/package/reflect-metadata)

---

**Built with ❤️ for the Elide Polyglot Runtime**
