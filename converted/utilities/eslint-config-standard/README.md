# ESLint Config Standard - Elide Polyglot Showcase

> **JavaScript Standard Style** - One style to rule them all, zero configuration

Standard JavaScript linting rules with no configuration needed.

## Features

- Zero configuration required
- 2 space indentation
- Single quotes for strings
- No semicolons (except when required)
- No trailing commas
- Zero dependencies
- **~1M downloads/week on npm**

## Quick Start

```typescript
import standardConfig from './elide-eslint-config-standard.ts';

// Get the full configuration
const config = standardConfig.getConfig();

// Validate code
const result = standardConfig.validate('const x = "hello";');
console.log(result); // { valid: false, errors: ['Use single quotes...'] }

// Format code
const formatted = standardConfig.format('const x = "hello";');
console.log(formatted); // const x = 'hello'
```

## Documentation

Run the demo:

```bash
elide run elide-eslint-config-standard.ts
```

## Links

- [Original npm package](https://www.npmjs.com/package/eslint-config-standard)
- [JavaScript Standard Style](https://standardjs.com/)

---

**Built with ❤️ for the Elide Polyglot Runtime**
