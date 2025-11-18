# injection-js - Elide Polyglot Showcase

> **Angular dependency injection for ALL languages** - TypeScript, Python, Ruby, and Java

## Features

- Hierarchical injectors
- Injection tokens
- Multi-providers
- Factory providers
- **~100K+ downloads/week on npm**

## Quick Start

```typescript
import { ReflectiveInjector, InjectionToken } from './elide-injection-js.ts';

const API_URL = new InjectionToken<string>('API_URL');
const injector = ReflectiveInjector.resolveAndCreate([
  { provide: API_URL, useValue: 'https://api.example.com' }
]);

console.log(injector.get(API_URL));
```

## Links

- [Original npm package](https://www.npmjs.com/package/injection-js)

---

**Built with ❤️ for the Elide Polyglot Runtime**
