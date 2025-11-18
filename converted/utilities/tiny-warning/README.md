# tiny-warning - Elide Polyglot Showcase

> **Tiny development warning for ALL languages** - TypeScript, Python, Ruby, and Java

## Features

- Ultra-small (< 200 bytes)
- TypeScript support
- Development warnings
- **~25M downloads/week on npm**

## Quick Start

```typescript
import warning from './elide-tiny-warning.ts';

function updateProfile(data: any) {
  warning(data.email, 'Email is recommended');
  warning(data.name?.length > 0, 'Name should not be empty');

  // Update profile...
}
```

## Links

- [Original npm package](https://www.npmjs.com/package/tiny-warning)

---

**Built with ❤️ for the Elide Polyglot Runtime**
