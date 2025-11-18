# parse-filepath - Parse File Paths - Elide Polyglot Showcase

> **One path parser for ALL languages** - TypeScript, Python, Ruby, and Java

Parse file paths into root, directory, basename, extension, and name components.

## ✨ Features

- ✅ Extract root, dir, base, ext, name
- ✅ Handle Windows and Unix paths
- ✅ Detect absolute vs relative
- ✅ **Polyglot**: Use from TypeScript, Python, Ruby, and Java
- ✅ Zero dependencies

## 🚀 Quick Start

### TypeScript
```typescript
import parseFilepath from './elide-parse-filepath.ts';

const parsed = parseFilepath("/home/user/documents/report.pdf");

console.log(parsed.root);      // '/'
console.log(parsed.dir);       // '/home/user/documents'
console.log(parsed.base);      // 'report.pdf'
console.log(parsed.ext);       // '.pdf'
console.log(parsed.name);      // 'report'
console.log(parsed.isAbsolute); // true
```

## 💡 Real-World Use Cases

### Change File Extension
```typescript
const parsed = parseFilepath("src/index.ts");
const outputPath = `${parsed.dir}/${parsed.name}.js`;
// 'src/index.js'
```

### Build Tool
```typescript
const files = ["src/index.ts", "src/App.tsx"];

files.forEach(file => {
  const parsed = parseFilepath(file);
  const output = `dist/${parsed.name}.js`;
  console.log(`${file} → ${output}`);
});
```

## 📖 API Reference

### `parseFilepath(path: string): ParsedPath`

Returns object with:
- `root` - Root path (`/` or `C:`)
- `dir` - Directory path
- `base` - Filename with extension
- `ext` - Extension (including dot)
- `name` - Filename without extension
- `isAbsolute` - Whether path is absolute

## 🌐 Links

- [npm parse-filepath package](https://www.npmjs.com/package/parse-filepath) (50K+ downloads/week)

---

**Built with ❤️ for the Elide Polyglot Runtime**
