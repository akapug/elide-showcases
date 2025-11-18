# ShellJS - Elide Polyglot Showcase

> **One shelljs implementation for ALL languages** - TypeScript, Python, Ruby, and Java

Portable Unix shell commands for Node.js with a single implementation that works across your entire polyglot stack.

## 🌟 Why This Matters

In polyglot architectures, having **different shell command implementations** in each language creates:
- ❌ Inconsistent file operations across services
- ❌ Multiple libraries to maintain and audit
- ❌ Platform-specific code
- ❌ Complex testing requirements
- ❌ Build script fragmentation

**Elide solves this** with ONE implementation that works in ALL languages.

## ✨ Features

- ✅ Unix shell commands (ls, cd, mkdir, rm, cp, mv, etc.)
- ✅ **Polyglot**: Use from TypeScript, Python, Ruby, and Java
- ✅ Zero dependencies
- ✅ Cross-platform compatibility
- ✅ Synchronous operations
- ✅ Built-in error handling
- ✅ Consistent behavior across all languages

## 🚀 Quick Start

### TypeScript

```typescript
import shell from './elide-shelljs.ts';

shell.cd('src');
const files = shell.ls('.');
shell.mkdir('-p', 'build/output');
console.log(files);
```

### Python

```python
from elide import require
shell = require('./elide-shelljs.ts').default

shell.cd('src')
files = shell.ls('.')
shell.mkdir('-p', 'build/output')
print(files)
```

### Ruby

```ruby
shell = Elide.require('./elide-shelljs.ts').default

shell.cd('src')
files = shell.ls('.')
shell.mkdir('-p', 'build/output')
puts files
```

### Java

```java
Context context = Context.newBuilder("js").allowAllAccess(true).build();
Value shellModule = context.eval("js", "require('./elide-shelljs.ts')");
Value shell = shellModule.getMember("default");

shell.getMember("cd").execute("src");
var files = shell.getMember("ls").execute(".");
System.out.println(files);
```

## 📦 API

- `cd(dir)` - Change directory
- `pwd()` - Get current directory
- `ls([options], [path])` - List files
- `mkdir([options], dir)` - Create directory
- `rm([options], files)` - Remove files
- `cp([options], source, dest)` - Copy files
- `mv([options], source, dest)` - Move files
- `test(flag, path)` - Test file/directory
- `cat(...files)` - Read file contents
- `exec(command)` - Execute command
- `which(command)` - Find command location
- `echo(text)` - Echo text (chainable with .to())
- `find(path)` - Find files recursively

## 💡 Use Cases

Cross-platform shell operations, build scripts, file management

## 🌐 Links

- [Elide Documentation](https://docs.elide.dev)
- [npm shelljs package](https://www.npmjs.com/package/shelljs) (original, ~2M/week downloads)

## 📝 Package Stats

- **npm downloads**: ~2M/week
- **Use case**: Cross-platform shell operations, build scripts, file management
- **Elide advantage**: One implementation for all languages
- **Polyglot score**: High - Essential for build automation

---

**Built with ❤️ for the Elide Polyglot Runtime**

*Making shell commands consistent across all languages.*
