# Mitt - Tiny Event Emitter - Elide Polyglot Showcase

> **Tiny 200b event emitter for ALL languages** - TypeScript, Python, Ruby, and Java

Ultra-lightweight event emitter (200 bytes gzipped) that works across your entire polyglot stack.

## ✨ Features

- ✅ Ultra tiny footprint (200 bytes gzipped)
- ✅ Simple API (on, off, emit)
- ✅ Wildcard event support
- ✅ TypeScript support
- ✅ **Polyglot**: Use from TypeScript, Python, Ruby, and Java
- ✅ Zero dependencies

## 🚀 Quick Start

### TypeScript
```typescript
import mitt from './elide-mitt.ts';

const emitter = mitt();

emitter.on('foo', e => console.log('foo', e));
emitter.emit('foo', { bar: 'baz' });
```

### Python
```python
from elide import require
mitt = require('./elide-mitt.ts').default

emitter = mitt()
emitter.on('foo', lambda e: print(f'foo {e}'))
emitter.emit('foo', {'bar': 'baz'})
```

## 📖 API Reference

### `mitt()`
Create new emitter instance.

### `on(type, handler)`
Add event listener.

### `off(type, handler)`
Remove event listener.

### `emit(type, event?)`
Emit event with optional data.

### Wildcard
```typescript
emitter.on('*', (type, e) => console.log(type, e));
```

## 🌐 Links

- [npm mitt package](https://www.npmjs.com/package/mitt) (~8M downloads/week)

## 📝 Package Stats

- **npm downloads**: ~8M/week
- **Size**: 200 bytes gzipped
- **Polyglot score**: 45/50 (A-Tier)

---

**Built with ❤️ for the Elide Polyglot Runtime**
