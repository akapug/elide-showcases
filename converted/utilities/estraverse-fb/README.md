# Estraverse FB - Facebook Fork - Elide Polyglot Showcase

> **One AST/parser implementation for ALL languages** - TypeScript, Python, Ruby, and Java

Facebook's enhanced fork of estraverse with a single implementation that works across your entire polyglot stack.

## 🌟 Why This Matters

In polyglot architectures, having **different AST/parser implementations** in each language creates:
- ❌ Inconsistent AST formats across services
- ❌ Multiple libraries to maintain and audit
- ❌ Complex integration requirements
- ❌ Debugging issues across language boundaries

**Elide solves this** with ONE implementation that works in ALL languages.

## ✨ Features

- ✅ Facebook's enhanced fork of estraverse
- ✅ Fast and efficient processing
- ✅ ESTree/spec-compliant output
- ✅ Source location tracking
- ✅ **Polyglot**: Use from TypeScript, Python, Ruby, and Java
- ✅ Zero dependencies
- ✅ High performance parsing

## 🚀 Quick Start

### TypeScript

```typescript
import { parse, generate, traverse } from './elide-estraverse-fb.ts';

// Parse code
const ast = parse('const x = 42;');
console.log(ast);

// Generate code
const code = generate(ast);
console.log(code);

// Traverse AST
traverse(ast, node => {
  console.log(node.type);
});
```

### Python

```python
from elide import require
parser = require('./elide-estraverse-fb.ts')

# Parse code
ast = parser.parse('const x = 42;')
print(ast)

# Generate code
code = parser.generate(ast)
print(code)
```

### Ruby

```ruby
parser = Elide.require('./elide-estraverse-fb.ts')

# Parse code
ast = parser.parse('const x = 42;')
puts ast

# Generate code  
code = parser.generate(ast)
puts code
```

### Java

```java
Context context = Context.newBuilder("js").allowAllAccess(true).build();
Value parser = context.eval("js", "require('./elide-estraverse-fb.ts')");

// Parse code
Value ast = parser.getMember("parse").execute("const x = 42;");
System.out.println(ast);

// Generate code
String code = parser.getMember("generate").execute(ast).asString();
System.out.println(code);
```

## 🎯 Why Polyglot?

### The Problem

**Before**: Each language has its own AST/parser library

```
┌─────────────────────────────────────┐
│  4 Different Parser Implementations │
├─────────────────────────────────────┤
│ ❌ Node.js: estraverse-fb package            │
│ ❌ Python: different parser         │
│ ❌ Ruby: different gem              │
│ ❌ Java: different library          │
└─────────────────────────────────────┘
         ↓
    Problems:
    • Inconsistent AST formats
    • 4 libraries to maintain
    • Complex integration
    • Different behaviors
```

### The Solution

**After**: One Elide implementation for all languages

```
┌─────────────────────────────────────┐
│     Elide Estraverse FB - Facebook Fork (TypeScript)      │
│     elide-estraverse-fb.ts                  │
└─────────────────────────────────────┘
         ↓           ↓           ↓
    ┌────────┐  ┌────────┐  ┌────────┐
    │ Node.js│  │ Python │  │  Ruby  │
    │  Tools │  │Scripts │  │Services│
    └────────┘  └────────┘  └────────┘
         ↓
    Benefits:
    ✅ One implementation
    ✅ Consistent AST format
    ✅ Single test suite
    ✅ Universal tooling
```

## 📖 API Reference

### `parse(source: string, options?: ParseOptions): Node`

Parse source code into AST.

```typescript
const ast = parse('const x = 42;');
// Returns: { type: 'Program', body: [...], sourceType: 'module' }
```

### `generate(ast: Node): string`

Generate source code from AST.

```typescript
const code = generate(ast);
// Returns: "const x = 42;"
```

### `traverse(ast: Node, visitor: (node: Node) => void): void`

Traverse all AST nodes.

```typescript
traverse(ast, node => {
  if (node.type === 'Identifier') {
    console.log(node.name);
  }
});
```

### `findNodes(ast: Node, predicate: (node: Node) => boolean): Node[]`

Find all nodes matching a condition.

```typescript
const declarations = findNodes(ast, n => n.type === 'VariableDeclaration');
```

## 💡 Use Cases

### Code Analysis Tools

```typescript
// Analyze code in any language using Elide
const ast = parse(sourceCode);
const complexity = calculateComplexity(ast);
const issues = findIssues(ast);
```

### Code Transformations

```typescript
// Transform AST and regenerate code
traverse(ast, node => {
  if (node.type === 'Identifier' && node.name === 'old') {
    node.name = 'new';
  }
});
const newCode = generate(ast);
```

### Static Analysis

```typescript
// Find all function declarations
const functions = findNodes(ast, n => n.type === 'FunctionDeclaration');
console.log(`Found ${functions.length} functions`);
```

### Linting and Validation

```typescript
// Build custom linting rules
traverse(ast, node => {
  if (node.type === 'VariableDeclaration' && node.kind === 'var') {
    console.warn('Use const or let instead of var');
  }
});
```

## 🧪 Testing

### Run the demo

```bash
elide run elide-estraverse-fb.ts
```

Shows comprehensive examples covering:
- Parsing different code patterns
- Code generation
- AST traversal
- Node finding and filtering
- Real-world use cases

## 📝 Package Stats

- **npm downloads**: ~100K+/week
- **Use case**: Facebook tooling, Flow integration
- **Elide advantage**: One implementation for all languages
- **Performance**: Fast and efficient on Elide runtime
- **Polyglot score**: S-Tier - Essential AST/parser tool

## 🌐 Links

- [Elide Documentation](https://docs.elide.dev)
- [npm package](https://www.npmjs.com/package/estraverse-fb)
- [GitHub: elide-showcases](https://github.com/elide-dev/elide-showcases)

---

**Built with ❤️ for the Elide Polyglot Runtime**

*One parser to rule them all.*
