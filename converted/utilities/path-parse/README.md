# path-parse - Parse Path Strings - Elide Polyglot Showcase

> **One path parser for ALL languages**

Parse path strings into components (root, dir, base, ext, name).

## 🚀 Quick Start

```typescript
import parse from './elide-path-parse.ts';

const parsed = parse("/home/user/file.txt");
// { root: '/', dir: '/home/user', base: 'file.txt', ext: '.txt', name: 'file' }
```

## 📖 API

### `parse(path: string): PathObject`

Returns: `{ root, dir, base, ext, name }`

## 📝 Stats

- **npm downloads**: ~5M+/week
- **Zero dependencies**

---

**Built with ❤️ for the Elide Polyglot Runtime**
