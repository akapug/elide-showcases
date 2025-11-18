# EditorConfig Checker - Elide Polyglot Showcase

> **Verify EditorConfig compliance** - Check files against EditorConfig rules

A tool to verify that your files comply with your EditorConfig rules.

## Features

- Check EditorConfig compliance
- Support all EditorConfig rules
- CI/CD integration
- **~50K downloads/week on npm**

## Quick Start

```typescript
import checker from './elide-editorconfig-checker.ts';

const rules = { indent_style: 'space', indent_size: 2 };
const result = checker.check('const x = 10;', rules);
console.log(result);
```

## Links

- [Original npm package](https://www.npmjs.com/package/editorconfig-checker)

---

**Built with ❤️ for the Elide Polyglot Runtime**
