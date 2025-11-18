# friendly-errors-webpack-plugin - Elide Polyglot Showcase

> **Error formatting for ALL build systems**

## Features

- Friendly error messages
- Clean output
- Success messages
- **~500K+ downloads/week on npm**

## Quick Start

```typescript
import FriendlyErrorsWebpackPlugin from './elide-friendly-errors-webpack-plugin.ts';

const plugin = new FriendlyErrorsWebpackPlugin();
plugin.addError({ message: 'Module not found', file: 'src/index.ts' });
plugin.displayErrors();
```

## Links

- [Original npm package](https://www.npmjs.com/package/friendly-errors-webpack-plugin)

---

**Built with ❤️ for the Elide Polyglot Runtime**
