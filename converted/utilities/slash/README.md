# slash - Convert Windows Backslashes - Elide Polyglot Showcase

> **One path converter for ALL platforms** - TypeScript, Python, Ruby, and Java

Convert Windows-style backslashes to Unix-style forward slashes with a single implementation.

## 🌟 Why This Matters

Windows uses backslashes (`\`), Unix uses forward slashes (`/`):
- Windows: `C:\Users\John\file.txt`
- Unix: `/home/john/file.txt`
- This causes issues in cross-platform code

**Elide slash solves this** with ONE simple function:
```typescript
slash("C:\\Users\\John\\file.txt")  // 'C:/Users/John/file.txt'
```

## ✨ Features

- ✅ Convert backslashes to forward slashes
- ✅ Handle Windows paths
- ✅ Works with relative and absolute paths
- ✅ **Polyglot**: Use from TypeScript, Python, Ruby, and Java
- ✅ Simple, focused API
- ✅ Zero dependencies

## 🚀 Quick Start

### TypeScript
```typescript
import slash from './elide-slash.ts';

slash("C:\\Users\\John\\file.txt");    // 'C:/Users/John/file.txt'
slash("src\\components\\App.tsx");     // 'src/components/App.tsx'
slash("/already/unix/style");          // '/already/unix/style'
```

### Python
```python
from elide import require
slash = require('./elide-slash.ts').slash

path = slash("C:\\Users\\John\\file.txt")
print(path)  # 'C:/Users/John/file.txt'
```

### Ruby
```ruby
slash_fn = Elide.require('./elide-slash.ts').slash

path = slash_fn.call("C:\\Users\\John\\file.txt")
puts path  # 'C:/Users/John/file.txt'
```

### Java
```java
Value slash = context.eval("js", "require('./elide-slash.ts')");
String path = slash.invokeMember("slash", "C:\\Users\\John\\file.txt").asString();
System.out.println(path);  // 'C:/Users/John/file.txt'
```

## 💡 Real-World Use Cases

### 1. Build Tool Paths
```typescript
import slash from './elide-slash.ts';

const files = [
  "src\\index.ts",
  "src\\components\\App.tsx",
  "src\\utils\\helpers.ts"
];

const normalized = files.map(slash);
// ['src/index.ts', 'src/components/App.tsx', 'src/utils/helpers.ts']
```

### 2. URL Generation
```typescript
import slash from './elide-slash.ts';

const filePath = "uploads\\images\\photo.jpg";
const url = `https://cdn.example.com/${slash(filePath)}`;
// 'https://cdn.example.com/uploads/images/photo.jpg'
```

### 3. Import Path Fixing
```typescript
import slash from './elide-slash.ts';

const importPath = "..\\..\\utils\\database";
const fixedImport = `import { db } from '${slash(importPath)}';`;
// import { db } from '../../utils/database';
```

## 📖 API Reference

### `slash(path: string): string`

Convert Windows backslashes to forward slashes.

```typescript
slash("C:\\Users\\John")        // 'C:/Users/John'
slash("src\\components")        // 'src/components'
slash("/already/unix")          // '/already/unix' (unchanged)
```

## 🌐 Links

- [Elide Documentation](https://docs.elide.dev)
- [npm slash package](https://www.npmjs.com/package/slash) (3M+ downloads/week)

## 📝 Package Stats

- **npm downloads**: ~3M+/week
- **Use case**: Path normalization across platforms
- **Elide advantage**: One implementation for all languages
- **Zero dependencies**: Single function

---

**Built with ❤️ for the Elide Polyglot Runtime**

*Making paths universal, everywhere.*
