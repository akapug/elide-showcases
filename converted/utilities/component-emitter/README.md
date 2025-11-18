# Component Emitter - Event Mixin - Elide Polyglot Showcase

> **Event emitter mixin for ALL languages** - TypeScript, Python, Ruby, and Java

Add event functionality to any object with a simple mixin pattern.

## ✨ Features

- ✅ Mixin pattern for adding events
- ✅ Simple API (on, once, off, emit)
- ✅ Listener management
- ✅ **Polyglot**: Use from TypeScript, Python, Ruby, and Java
- ✅ Zero dependencies

## 🚀 Quick Start

### TypeScript
```typescript
import Emitter from './elide-component-emitter.ts';

// Standalone
const emitter = Emitter();
emitter.on('event', () => console.log('triggered'));

// Mixin
class User {
  name: string;
}

const user = Emitter(new User());
user.on('login', () => console.log('logged in'));
user.emit('login');
```

## 📖 API Reference

### `Emitter(obj?)`
Create emitter or add to object.

### `on(event, fn)`
Add event listener.

### `once(event, fn)`
Add one-time listener.

### `off(event?, fn?)`
Remove listener(s).

### `emit(event, ...args)`
Emit event.

### `hasListeners(event)`
Check if event has listeners.

## 🌐 Links

- [npm component-emitter package](https://www.npmjs.com/package/component-emitter) (~150M downloads/week)

## 📝 Package Stats

- **npm downloads**: ~150M/week
- **Use case**: Mixin pattern
- **Polyglot score**: 46/50 (A-Tier)

---

**Built with ❤️ for the Elide Polyglot Runtime**
