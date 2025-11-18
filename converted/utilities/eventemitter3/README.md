# EventEmitter3 - Fast Event Emitter - Elide Polyglot Showcase

> **One event emitter for ALL languages** - TypeScript, Python, Ruby, and Java

A high-performance event emitter implementation that works across your entire polyglot stack.

## 🌟 Why This Matters

Event-driven architectures are **fragmented across languages**:
- Node.js: `EventEmitter`
- Python: Custom observer patterns or third-party libs
- Ruby: `Observable` module or gems
- Java: `EventListener` interfaces or frameworks

**Elide solves this** with ONE event emitter that works in ALL languages.

## ✨ Features

- ✅ Fast event emitting and listener management
- ✅ Support for once listeners
- ✅ Remove listeners by function reference
- ✅ Remove all listeners for an event
- ✅ Get listener count and event names
- ✅ **Polyglot**: Use from TypeScript, Python, Ruby, and Java
- ✅ Zero dependencies

## 🚀 Quick Start

### TypeScript
```typescript
import EventEmitter from './elide-eventemitter3.ts';

const emitter = new EventEmitter();

emitter.on('message', (text: string) => {
  console.log(`Received: ${text}`);
});

emitter.emit('message', 'Hello, World!');
```

### Python
```python
from elide import require
EventEmitter = require('./elide-eventemitter3.ts').default

emitter = EventEmitter()
emitter.on('message', lambda text: print(f'Received: {text}'))
emitter.emit('message', 'Hello, World!')
```

### Ruby
```ruby
EventEmitter = Elide.require('./elide-eventemitter3.ts').default

emitter = EventEmitter.new
emitter.on('message') { |text| puts "Received: #{text}" }
emitter.emit('message', 'Hello, World!')
```

### Java
```java
Value EventEmitter = context.eval("js", "require('./elide-eventemitter3.ts').default");
Value emitter = EventEmitter.newInstance();

emitter.invokeMember("on", "message", (Consumer<String>) text -> {
  System.out.println("Received: " + text);
});

emitter.invokeMember("emit", "message", "Hello, World!");
```

## 📖 API Reference

### `new EventEmitter()`
Create a new event emitter instance.

### `on(event, listener)`
Add an event listener.
```typescript
emitter.on('data', (value) => {
  console.log(value);
});
```

### `once(event, listener)`
Add a one-time event listener.
```typescript
emitter.once('init', () => {
  console.log('Initialized');
});
```

### `emit(event, ...args)`
Emit an event with arguments.
```typescript
emitter.emit('user:login', 'alice', Date.now());
```

### `off(event, listener)` / `removeListener(event, listener)`
Remove a specific listener.
```typescript
const handler = () => console.log('test');
emitter.on('test', handler);
emitter.off('test', handler);
```

### `removeAllListeners(event?)`
Remove all listeners for an event, or all events.
```typescript
emitter.removeAllListeners('data'); // Remove all 'data' listeners
emitter.removeAllListeners(); // Remove all listeners
```

### `listeners(event)`
Get all listeners for an event.
```typescript
const listeners = emitter.listeners('data');
```

### `listenerCount(event)`
Get the listener count for an event.
```typescript
const count = emitter.listenerCount('data');
```

### `eventNames()`
Get all event names.
```typescript
const names = emitter.eventNames(); // ['data', 'message', ...]
```

## 💡 Real-World Use Cases

### Application Event Bus
```typescript
// Decouple components with events
const eventBus = new EventEmitter();

eventBus.on('user:login', (user) => {
  analytics.track('login', user);
  notifications.welcome(user);
});

eventBus.emit('user:login', { id: 1, name: 'Alice' });
```

### Plugin System
```typescript
// Load and register plugins
const plugins = new EventEmitter();

plugins.on('plugin:loaded', (plugin) => {
  console.log(`Loaded: ${plugin.name}`);
});

loadPlugin('auth').then(plugin => {
  plugins.emit('plugin:loaded', plugin);
});
```

### State Change Notifications
```typescript
// Notify on state changes
const store = new EventEmitter();

store.on('state:changed', (newState) => {
  ui.render(newState);
  localStorage.save(newState);
});

store.emit('state:changed', { user: 'alice', theme: 'dark' });
```

## 🎯 Why Polyglot?

### The Problem

**Before**: Each language has different event patterns

```
Node.js:  EventEmitter class
Python:   Custom observer pattern
Ruby:     Observable module
Java:     EventListener interfaces
```

**Issues**:
- 4 different implementations
- Different APIs and semantics
- Hard to share event logic
- Inconsistent behavior

### The Solution

**After**: One Elide implementation for all languages

```
┌─────────────────────────────────────┐
│   Elide EventEmitter3 (TypeScript) │
│   elide-eventemitter3.ts           │
└─────────────────────────────────────┘
         ↓           ↓           ↓
    ┌────────┐  ┌────────┐  ┌────────┐
    │ Node.js│  │ Python │  │  Ruby  │
    │  API   │  │Workers │  │Sidekiq │
    └────────┘  └────────┘  └────────┘
         ↓
    All use: emitter.emit('event', data)
    ✅ Same API everywhere
```

## 🧪 Testing

### Run the demo
```bash
/tmp/elide-1.0.0-beta10-linux-amd64/elide run elide-eventemitter3.ts
```

## 📂 Files in This Showcase

- `elide-eventemitter3.ts` - Main TypeScript implementation
- `README.md` - This file

## 🌐 Links

- [Elide Documentation](https://docs.elide.dev)
- [npm eventemitter3 package](https://www.npmjs.com/package/eventemitter3) (original, ~150M downloads/week)
- [GitHub: elide-showcases](https://github.com/akapug/elide-showcases)

## 📝 Package Stats

- **npm downloads**: ~150M/week (original eventemitter3 package)
- **Use case**: Universal (every language needs events)
- **Elide advantage**: One implementation for all languages
- **Polyglot score**: 48/50 (S-Tier) - Critical polyglot showcase

---

**Built with ❤️ for the Elide Polyglot Runtime**

*Making events consistent, everywhere.*
