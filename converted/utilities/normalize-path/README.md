# normalize-path - Normalize File Paths - Elide Polyglot Showcase

> **One path normalizer for ALL platforms** - TypeScript, Python, Ruby, and Java

Normalize file paths to be cross-platform compatible with a single implementation.

## 🌟 Why This Matters

Path formats vary across platforms:
- Windows: `C:\Users\John\file.txt`
- Unix: `/home/john/file.txt`
- Mixed: `path/to\mixed\slashes`

**Elide normalize-path solves this** with ONE function:
```typescript
normalizePath("C:\\Users\\John\\file.txt")  // 'C:/Users/John/file.txt'
```

## ✨ Features

- ✅ Convert backslashes to forward slashes
- ✅ Remove trailing slashes (configurable)
- ✅ Handle mixed slashes
- ✅ **Polyglot**: Use from TypeScript, Python, Ruby, and Java
- ✅ Cross-platform compatible
- ✅ Zero dependencies

## 🚀 Quick Start

### TypeScript
```typescript
import normalizePath from './elide-normalize-path.ts';

normalizePath("C:\\Users\\John\\file.txt");   // 'C:/Users/John/file.txt'
normalizePath("path/to/dir/");                // 'path/to/dir'
normalizePath("path/to/dir/", false);         // 'path/to/dir/' (keep trailing)
```

### Python
```python
from elide import require
normalize_path = require('./elide-normalize-path.ts').normalizePath

path = normalize_path("C:\\Users\\John\\file.txt")
print(path)  # 'C:/Users/John/file.txt'
```

### Ruby
```ruby
normalize_path = Elide.require('./elide-normalize-path.ts').normalizePath

path = normalize_path.call("C:\\Users\\John\\file.txt")
puts path  # 'C:/Users/John/file.txt'
```

## 💡 Real-World Use Cases

### 1. Build Tool Paths
```typescript
import normalizePath from './elide-normalize-path.ts';

const entries = [
  "src\\index.ts",
  "src/components/App.tsx",
  "src\\utils\\helpers.ts"
];

const normalized = entries.map(normalizePath);
// ['src/index.ts', 'src/components/App.tsx', 'src/utils/helpers.ts']
```

### 2. Path Comparison
```typescript
import normalizePath from './elide-normalize-path.ts';

const path1 = "src\\components\\Button";
const path2 = "src/components/Button/";

console.log(normalizePath(path1) === normalizePath(path2));  // true
```

### 3. Glob Patterns
```typescript
import normalizePath from './elide-normalize-path.ts';

const patterns = [
  "src\\**\\*.ts",
  "test/**/*.spec.ts"
].map(normalizePath);
```

## 📖 API Reference

### `normalizePath(path: string, stripTrailing?: boolean): string`

Normalize file path.

```typescript
normalizePath("C:\\Users")              // 'C:/Users'
normalizePath("path/to/dir/")           // 'path/to/dir'
normalizePath("path/to/dir/", false)    // 'path/to/dir/'
```

## 🌐 Links

- [Elide Documentation](https://docs.elide.dev)
- [npm normalize-path package](https://www.npmjs.com/package/normalize-path) (10M+ downloads/week)

## 📝 Package Stats

- **npm downloads**: ~10M+/week
- **Use case**: Path normalization for build tools
- **Elide advantage**: One implementation for all platforms
- **Zero dependencies**: Pure TypeScript

---

**Built with ❤️ for the Elide Polyglot Runtime**

*Making paths canonical, everywhere.*
