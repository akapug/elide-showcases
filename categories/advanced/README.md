# Advanced TypeScript - Modern Language Features

**11 advanced TypeScript showcases** demonstrating modern language features and patterns.

## 🎯 What's Included

Advanced TypeScript features and patterns:
- **Generics** - Type-safe generic functions and classes
- **Decorators** - Class and method decorators
- **Type Guards** - Custom type narrowing
- **Conditional Types** - Advanced type manipulation
- **Mapped Types** - Type transformations
- **Template Literal Types** - String manipulation at type level
- **Utility Types** - Built-in type helpers
- **Meta-programming** - Reflection and dynamic behavior
- **Async Patterns** - Advanced async/await usage
- **Type Inference** - Complex inference scenarios

## 📁 Showcases (11 total)

Each showcase demonstrates:
- Real-world use case
- Best practices
- Type safety benefits
- Performance considerations
- Common patterns and anti-patterns

## 🚀 Quick Start

```bash
cd categories/advanced

# Generics showcase
elide run generics.ts

# Decorators example
elide run decorators.ts

# Type guards demo
elide run type-guards.ts

# Advanced types
elide run advanced-types.ts
```

## 💡 Use Cases

### Type-Safe APIs:
```typescript
// Generic API client
class APIClient<T> {
  async get(endpoint: string): Promise<T> {
    // Type-safe API calls
  }
}
```

### Validation with Type Guards:
```typescript
// Custom type guard
function isUser(obj: unknown): obj is User {
  return typeof obj === 'object' && obj !== null && 'id' in obj;
}

if (isUser(data)) {
  // TypeScript knows data is User here
  console.log(data.id);
}
```

### Decorator-Based Architecture:
```typescript
// Method decorators for logging
class Service {
  @Log
  @Cache(60)
  async getData() {
    // Auto-logged and cached
  }
}
```

### Advanced Type Transformations:
```typescript
// Make all properties readonly recursively
type DeepReadonly<T> = {
  readonly [P in keyof T]: DeepReadonly<T[P]>;
};
```

## 🏆 Highlights

### Most Powerful:
- **Conditional Types** - Complex type logic
- **Mapped Types** - Transform object types
- **Template Literal Types** - String type manipulation

### Most Practical:
- **Generics** - Reusable type-safe code
- **Type Guards** - Runtime type safety
- **Utility Types** - Common transformations

### Best for Learning:
- **Generics basics** - Foundation for advanced features
- **Simple decorators** - Metaprogramming introduction
- **Basic type guards** - Runtime type checking

## 🎨 Example: Complete Type-Safe System

```typescript
// Combining multiple advanced features

// Generic repository with type guards
class Repository<T extends { id: string }> {
  private items = new Map<string, T>();

  @Log
  @Validate
  add(item: T): void {
    if (!this.isValidItem(item)) {
      throw new Error('Invalid item');
    }
    this.items.set(item.id, item);
  }

  get(id: string): T | undefined {
    return this.items.get(id);
  }

  // Type guard
  private isValidItem(item: unknown): item is T {
    return typeof item === 'object' && item !== null && 'id' in item;
  }
}

// Usage with full type safety
interface User {
  id: string;
  name: string;
}

const userRepo = new Repository<User>();
userRepo.add({ id: '1', name: 'Alice' }); // ✓ Type-safe
// userRepo.add({ id: '2' }); // ✗ TypeScript error - missing 'name'
```

## 📊 Features Demonstrated

### 1. Generics
- Generic functions
- Generic classes
- Generic constraints
- Multiple type parameters
- Default type parameters

### 2. Decorators
- Class decorators
- Method decorators
- Property decorators
- Parameter decorators
- Decorator factories

### 3. Type Guards
- Primitive type guards
- Custom type guards
- Discriminated unions
- Type predicates
- Assertion functions

### 4. Advanced Types
- Conditional types
- Mapped types
- Template literal types
- Indexed access types
- Recursive types

### 5. Utility Types
- Partial, Required, Readonly
- Pick, Omit, Record
- Exclude, Extract, NonNullable
- ReturnType, Parameters
- Custom utility types

## ⚡ Performance Considerations

All examples are optimized for:
- **Runtime performance** - No unnecessary overhead
- **Compile-time checking** - Catch errors before runtime
- **Type inference** - Minimal explicit type annotations
- **Elide optimization** - Fast execution on Elide runtime

## 🔧 Learning Path

Recommended order for learning:

1. **Generics** - Foundation for type-safe code
2. **Type Guards** - Runtime type safety
3. **Utility Types** - Common patterns
4. **Decorators** - Metaprogramming basics
5. **Mapped Types** - Type transformations
6. **Conditional Types** - Advanced type logic
7. **Template Literal Types** - String manipulation
8. **Advanced Patterns** - Combining features

## 💡 Best Practices

Each showcase includes:
- ✅ What to do
- ❌ What to avoid
- 💡 Pro tips
- 🎯 Real-world examples
- 📚 Further reading

---

**11 advanced showcases. Type-safe. Production-patterns.**
