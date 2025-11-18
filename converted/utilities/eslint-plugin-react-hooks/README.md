# ESLint Plugin React Hooks - Elide Polyglot Showcase

> **Enforce Rules of Hooks** - Prevent common React Hooks mistakes

ESLint plugin to enforce the Rules of Hooks.

## Features

- Enforce Rules of Hooks
- Exhaustive dependencies checking
- Custom hooks validation
- Zero dependencies
- **~10M downloads/week on npm**

## Quick Start

```typescript
import reactHooksPlugin from './elide-eslint-plugin-react-hooks.ts';

// Validate code
const result = reactHooksPlugin.validate('if (x) { useState(0); }');
console.log(result);

// Get configuration
const config = reactHooksPlugin.getConfig();
```

## Documentation

Run the demo:

```bash
elide run elide-eslint-plugin-react-hooks.ts
```

## Links

- [Original npm package](https://www.npmjs.com/package/eslint-plugin-react-hooks)
- [Rules of Hooks](https://reactjs.org/docs/hooks-rules.html)

---

**Built with ❤️ for the Elide Polyglot Runtime**
