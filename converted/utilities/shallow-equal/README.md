# Shallow Equal (shallow-equal) - Elide Polyglot Showcase

> **One shallow equality for ALL languages** - TypeScript, Python, Ruby, and Java

Fast shallow equality comparison used extensively in React and other frameworks.

## ✨ Features

- ✅ Fast shallow equality check
- ✅ Compares object keys and values (===)
- ✅ Does not recurse into nested objects
- ✅ **Polyglot**: Use from TypeScript, Python, Ruby, and Java
- ✅ Zero dependencies
- ✅ Extremely fast

## 🚀 Quick Start

```typescript
import shallowEqual from './elide-shallow-equal.ts';

shallowEqual({a: 1}, {a: 1})              // true
shallowEqual({a: 1}, {a: 2})              // false

// Nested objects compared by reference
const obj = {b: 1};
shallowEqual({a: obj}, {a: obj})          // true (same ref)
shallowEqual({a: {b: 1}}, {a: {b: 1}})    // false (different refs)
```

## 💡 Use Cases

### React.memo

```typescript
const MyComponent = React.memo(({ name, age }) => {
  return <div>{name} is {age} years old</div>;
}, shallowEqual);  // Only re-render if props change
```

### Props Comparison

```typescript
function shouldComponentUpdate(nextProps: any, currentProps: any): boolean {
  return !shallowEqual(nextProps, currentProps);
}
```

## 📝 Package Stats

- **npm downloads**: ~40M/week
- **Use case**: React props comparison, memoization
- **Elide advantage**: Polyglot consistency

## 🌐 Links

- [npm shallowequal package](https://www.npmjs.com/package/shallowequal) (~40M downloads/week)

---

**Built with ❤️ for the Elide Polyglot Runtime**
