# warning - Elide Polyglot Showcase

> **Display warnings in development for ALL languages** - TypeScript, Python, Ruby, and Java

## Features

- Development-only warnings
- Conditional warnings
- Console.warn wrapper
- **~30M downloads/week on npm**

## Quick Start

```typescript
import warning from './elide-warning.ts';

function setUserAge(age: number) {
  warning(age >= 0, 'Age should not be negative');
  warning(age < 150, 'Age seems unrealistic');

  // Process age...
}
```

## Links

- [Original npm package](https://www.npmjs.com/package/warning)

---

**Built with ❤️ for the Elide Polyglot Runtime**
