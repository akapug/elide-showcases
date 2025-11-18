# upath - Universal Path Utilities - Elide Polyglot Showcase

> **One path library for ALL platforms and languages** - TypeScript, Python, Ruby, and Java

Cross-platform path manipulation that works consistently on Windows, Mac, and Linux with a single implementation.

## 🌟 Why This Matters

Path handling is **different across platforms**:
- Windows: `C:\Users\John\file.txt` (backslashes, drive letters)
- Unix: `/home/john/file.txt` (forward slashes)
- Different path APIs across languages = compatibility nightmares

**Elide upath solves this** with ONE library that works in ALL languages:
- Always forward slashes
- Cross-platform compatible
- Consistent API everywhere

## ✨ Features

- ✅ Normalize paths to forward slashes
- ✅ Convert Windows paths to Unix style
- ✅ Join path segments safely
- ✅ Extract dirname, basename, extension
- ✅ Resolve relative paths
- ✅ **Polyglot**: Use from TypeScript, Python, Ruby, and Java
- ✅ Platform-independent
- ✅ Zero dependencies

## 🚀 Quick Start

### TypeScript
```typescript
import { normalize, join, toUnix, dirname, basename } from './elide-upath.ts';

// Normalize paths
normalize("C:\\Users\\John\\file.txt");  // 'c:/users/john/file.txt'
normalize("path//to///file.txt");        // 'path/to/file.txt'

// Join segments
join("path", "to", "file.txt");          // 'path/to/file.txt'

// Windows to Unix
toUnix("C:\\Program Files\\App");        // '/program files/app'

// Path components
dirname("path/to/file.txt");             // 'path/to'
basename("path/to/file.txt");            // 'file.txt'
```

### Python
```python
from elide import require
upath = require('./elide-upath.ts')

# Normalize paths
path = upath.normalize("C:\\Users\\John\\file.txt")
print(path)  # 'c:/users/john/file.txt'

# Join segments
joined = upath.join("path", "to", "file.txt")
print(joined)  # 'path/to/file.txt'
```

### Ruby
```ruby
upath = Elide.require('./elide-upath.ts')

# Normalize paths
path = upath.normalize("C:\\Users\\John\\file.txt")
puts path  # 'c:/users/john/file.txt'

# Join segments
joined = upath.join("path", "to", "file.txt")
puts joined  # 'path/to/file.txt'
```

### Java
```java
Value upath = context.eval("js", "require('./elide-upath.ts')");

// Normalize paths
String path = upath.invokeMember("normalize", "C:\\Users\\John\\file.txt").asString();
System.out.println(path);  // 'c:/users/john/file.txt'
```

## 📖 API Reference

### `normalize(path: string): string`

Normalize path to use forward slashes and remove duplicates.

```typescript
normalize("C:\\Users\\John\\file.txt")  // 'c:/users/john/file.txt'
normalize("path//to///file.txt")        // 'path/to/file.txt'
```

### `join(...paths: string[]): string`

Join path segments using forward slashes.

```typescript
join("path", "to", "file.txt")          // 'path/to/file.txt'
join("path/", "/to/", "/file.txt")      // 'path/to/file.txt'
```

### `toUnix(path: string): string`

Convert Windows path to Unix style (remove drive letter).

```typescript
toUnix("C:\\Users\\John\\file.txt")     // '/users/john/file.txt'
```

### `dirname(path: string): string`

Get directory name.

```typescript
dirname("path/to/file.txt")             // 'path/to'
```

### `basename(path: string, ext?: string): string`

Get filename, optionally removing extension.

```typescript
basename("path/to/file.txt")            // 'file.txt'
basename("path/to/file.txt", ".txt")    // 'file'
```

### `extname(path: string): string`

Get file extension.

```typescript
extname("path/to/file.txt")             // '.txt'
```

## 💡 Real-World Use Cases

### 1. Build Tool Paths
```typescript
import { join, normalize } from './elide-upath.ts';

const srcPath = join("src", "components", "Button.tsx");
const distPath = join("dist", "components", "Button.js");

console.log(srcPath);   // 'src/components/Button.tsx'
console.log(distPath);  // 'dist/components/Button.js'
```

### 2. URL Generation
```typescript
import { join } from './elide-upath.ts';

const baseUrl = "https://api.example.com";
const endpoint = join("api", "v1", "users", "123");

console.log(`${baseUrl}/${endpoint}`);
// 'https://api.example.com/api/v1/users/123'
```

### 3. Cross-Platform File Operations
```typescript
import { normalize, toUnix } from './elide-upath.ts';

// Works on Windows and Unix
const configPath = normalize(process.env.CONFIG_PATH || "config/app.json");
const unixPath = toUnix(configPath);
```

## 🎯 Why Polyglot?

### The Problem

**Before**: Each platform has different path formats

```
Windows:  C:\Users\John\file.txt
Mac:      /Users/John/file.txt
Linux:    /home/john/file.txt

Build breaks on Windows! ❌
```

### The Solution

**After**: One Elide implementation for all platforms

```
┌─────────────────────────────────────┐
│     Elide upath (TypeScript)       │
│     elide-upath.ts                 │
└─────────────────────────────────────┘
         ↓           ↓           ↓
    ┌────────┐  ┌────────┐  ┌────────┐
    │Windows │  │  Mac   │  │ Linux  │
    └────────┘  └────────┘  └────────┘
         ↓
    All use: 'path/to/file.txt' (forward slashes)
    ✅ Works everywhere
```

## 🧪 Testing

### Run the demo
```bash
elide run elide-upath.ts
```

## 📂 Files in This Showcase

- `elide-upath.ts` - Main TypeScript implementation
- `README.md` - This file

## 🌐 Links

- [Elide Documentation](https://docs.elide.dev)
- [npm upath package](https://www.npmjs.com/package/upath) (500K+ downloads/week)

## 📝 Package Stats

- **npm downloads**: ~500K+/week
- **Use case**: Cross-platform path manipulation
- **Elide advantage**: One implementation for all platforms
- **Zero dependencies**: Pure TypeScript

---

**Built with ❤️ for the Elide Polyglot Runtime**

*Making paths universal, everywhere.*
