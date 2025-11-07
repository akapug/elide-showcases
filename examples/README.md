# Examples - Educational TypeScript Projects

**2 educational examples** showcasing modern TypeScript patterns and real-world applications.

## 🎯 What's Included

Advanced examples for learning:
- **modern-typescript/** - Advanced TypeScript features and patterns
- **real-world/** - Production-ready API example

## 📁 Projects (2 total)

### Modern TypeScript
Advanced TypeScript features demonstration:
- Generics and type constraints
- Decorators and metaprogramming
- Advanced type manipulation
- Modern ES6+ features
- Type-safe patterns

**Location**: `examples/modern-typescript/`

### Real-World Example
Complete production-ready API:
- RESTful API implementation
- Error handling
- Validation
- TypeScript best practices
- Real-world patterns

**Location**: `examples/real-world/`

## 🚀 Quick Start

```bash
cd examples/modern-typescript
elide run advanced-features.ts

cd examples/real-world
elide run todo-api.ts
```

## 💡 Use Cases

### Learn TypeScript:
Study advanced TypeScript patterns and best practices used in production codebases.

### Reference Implementation:
Use these examples as templates for your own Elide projects.

### Best Practices:
See how to structure TypeScript projects for Elide runtime.

## ⚡ Performance

Both examples benefit from Elide's:
- **~20ms cold start** (vs ~200ms Node.js)
- **Instant TypeScript compilation**
- **Zero dependencies** (all code is self-contained)

## 🏆 Highlights

### Modern TypeScript Example:
- Complete showcase of TypeScript 5.x features
- Generics, decorators, advanced types
- Real-world patterns from production code
- Comprehensive comments explaining each feature

### Real-World Example:
- Production-ready TODO API
- Full CRUD operations
- Error handling and validation
- Type-safe throughout
- Clean architecture patterns

## 🎨 What You'll Learn

### Modern TypeScript:
1. **Generics** - Type-safe reusable code
2. **Decorators** - Metaprogramming patterns
3. **Advanced Types** - Conditional, mapped, template literal types
4. **Utility Types** - Built-in TypeScript helpers
5. **Type Guards** - Runtime type safety
6. **Async Patterns** - Modern async/await usage

### Real-World API:
1. **RESTful Design** - HTTP method patterns
2. **Error Handling** - Graceful failures
3. **Validation** - Input sanitization
4. **State Management** - In-memory data store
5. **TypeScript Patterns** - Real production code
6. **Testing** - How to test with Elide

## 📊 Code Quality

Both examples demonstrate:
- ✅ Full TypeScript type safety
- ✅ Zero `any` types (except where necessary)
- ✅ Comprehensive error handling
- ✅ Clean, readable code
- ✅ Production-ready patterns
- ✅ Extensive comments

## 🔧 Running the Examples

### Modern TypeScript:
```bash
cd examples/modern-typescript

# Run the demo
elide run advanced-features.ts

# Expected output:
# - Demonstrates all TypeScript features
# - Shows type safety in action
# - Explains each pattern with examples
```

### Real-World API:
```bash
cd examples/real-world

# Run the API server
elide run todo-api.ts

# Expected output:
# - API endpoints demonstrated
# - CRUD operations shown
# - Error handling examples
# - Validation in action
```

## 💡 Best Practices Demonstrated

### Type Safety:
```typescript
// Full type annotations
interface User {
  id: string;
  name: string;
  email: string;
}

function getUser(id: string): User | null {
  // Type-safe implementation
}
```

### Error Handling:
```typescript
// Graceful error handling
try {
  const result = riskyOperation();
} catch (error) {
  if (error instanceof ValidationError) {
    // Handle validation errors
  }
  throw error; // Re-throw unknown errors
}
```

### Validation:
```typescript
// Input validation
function validateEmail(email: string): boolean {
  return /^[^@]+@[^@]+\.[^@]+$/.test(email);
}

if (!validateEmail(userInput)) {
  throw new ValidationError('Invalid email');
}
```

## 🚀 Next Steps

After exploring these examples:

1. **Try modifying them** - Change functionality, add features
2. **Study the patterns** - Understand why code is structured this way
3. **Build your own** - Use as templates for new projects
4. **Explore categories/** - See more specific examples
5. **Check conversions/** - See real npm package conversions

## 📚 Further Learning

- See [CONTRIBUTING.md](../CONTRIBUTING.md) for creating new examples
- Check [docs/current/CONVERSION_KNOWLEDGE_BASE.md](../docs/current/CONVERSION_KNOWLEDGE_BASE.md) for patterns
- Review individual conversions for specific techniques

---

**2 examples. Production-quality. Educational.**
