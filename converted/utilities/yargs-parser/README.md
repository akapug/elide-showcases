# Yargs Parser - Elide Polyglot Showcase

> **Parse CLI arguments - works in ALL languages**

## 🚀 Quick Start

```typescript
import yargsParser from './elide-yargs-parser.ts';

const args = yargsParser(process.argv.slice(2), {
  boolean: ['verbose'],
  number: ['port']
});

console.log(args);
```

## 🌐 Links

- [npm yargs-parser](https://www.npmjs.com/package/yargs-parser) (~50M/week)

---

**Built with ❤️ for the Elide Polyglot Runtime**
