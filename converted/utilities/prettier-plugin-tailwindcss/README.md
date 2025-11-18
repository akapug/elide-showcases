# Prettier Plugin Tailwind CSS - Elide Polyglot Showcase

> **Sort Tailwind classes** - Automatically sort Tailwind CSS classes

Prettier plugin for automatically sorting Tailwind CSS classes.

## Features

- Auto-sort Tailwind classes
- Follows official order
- Works with custom classes
- **~500K downloads/week on npm**

## Quick Start

```typescript
import tailwindPlugin from './elide-prettier-plugin-tailwindcss.ts';

const sorted = tailwindPlugin.sortClasses('text-white bg-blue-500 p-4 rounded');
console.log(sorted); // 'flex p-4 bg-blue-500 text-white rounded'
```

## Links

- [Original npm package](https://www.npmjs.com/package/prettier-plugin-tailwindcss)

---

**Built with ❤️ for the Elide Polyglot Runtime**
