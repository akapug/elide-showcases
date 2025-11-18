# stylelint - Elide Polyglot Showcase

> **Modern CSS linter for ALL languages** - TypeScript, Python, Ruby, and Java

## Features

- Powerful CSS linter with 170+ rules
- Support for SCSS, Sass, Less, and modern CSS
- Auto-fix capability
- **15M+ downloads/week on npm**
- Plugin system for custom rules
- Custom syntax support

## Quick Start

```typescript
import { Stylelint } from './elide-stylelint.ts';

const stylelint = new Stylelint({
  rules: {
    'color-no-invalid-hex': true,
    'declaration-colon-space-after': 'always',
    'indentation': 2,
  },
});

const result = await stylelint.lint({ code: cssCode });
result.results[0].warnings.forEach(w => console.log(w.text));
```

## Links

- [Original npm package](https://www.npmjs.com/package/stylelint)

---

**Built with ❤️ for the Elide Polyglot Runtime**
