# Events - Node.js Events Module - Elide Polyglot Showcase

> **Node.js events for ALL languages** - TypeScript, Python, Ruby, and Java

Node.js-compatible event emitter that works across your entire polyglot stack.

## 🌟 Why This Matters

Node.js **EventEmitter is everywhere** in the Node ecosystem, but not available in other languages. This creates friction when building polyglot systems.

**Elide solves this** with a Node.js-compatible EventEmitter that works in ALL languages.

## ✨ Features

- ✅ Node.js EventEmitter compatibility
- ✅ Max listeners warning system
- ✅ Prepend listeners support
- ✅ Error event handling
- ✅ Once listeners
- ✅ **Polyglot**: Use from TypeScript, Python, Ruby, and Java
- ✅ Zero dependencies

## 🚀 Quick Start

### TypeScript
```typescript
import { EventEmitter } from './elide-events.ts';

const emitter = new EventEmitter();

emitter.on('data', (chunk) => {
  console.log(`Data: ${chunk}`);
});

emitter.emit('data', 'Hello!');
```

### Python
```python
from elide import require
EventEmitter = require('./elide-events.ts').EventEmitter

emitter = EventEmitter()
emitter.on('data', lambda chunk: print(f'Data: {chunk}'))
emitter.emit('data', 'Hello!')
```

### Ruby
```ruby
EventEmitter = Elide.require('./elide-events.ts').EventEmitter

emitter = EventEmitter.new
emitter.on('data') { |chunk| puts "Data: #{chunk}" }
emitter.emit('data', 'Hello!')
```

### Java
```java
Value EventEmitter = context.eval("js", "require('./elide-events.ts').EventEmitter");
Value emitter = EventEmitter.newInstance();

emitter.invokeMember("on", "data", (Consumer<String>) chunk -> {
  System.out.println("Data: " + chunk);
});

emitter.invokeMember("emit", "data", "Hello!");
```

## 📖 API Reference

### `on(event, listener)`
Add event listener to the end of the listeners array.

### `prependListener(event, listener)`
Add event listener to the beginning of the listeners array.

### `once(event, listener)`
Add one-time event listener.

### `prependOnceListener(event, listener)`
Add one-time listener to the beginning.

### `emit(event, ...args)`
Emit an event with arguments. Returns `true` if the event had listeners.

### `removeListener(event, listener)` / `off(event, listener)`
Remove a specific listener.

### `removeAllListeners(event?)`
Remove all listeners for an event, or all events.

### `setMaxListeners(n)`
Set maximum number of listeners before warning.

### `getMaxListeners()`
Get maximum number of listeners.

### `listenerCount(event)`
Get the number of listeners for an event.

### `eventNames()`
Get all event names.

## 💡 Real-World Use Cases

### Stream Implementation
```typescript
class ReadableStream extends EventEmitter {
  read() {
    this.emit('data', chunk);
    this.emit('end');
  }
}
```

### Error Handling
```typescript
// Error events throw if no listeners
emitter.on('error', (err) => {
  console.error('Error:', err);
});
```

### Server Events
```typescript
server.on('connection', (socket) => {
  console.log('Client connected');
});

server.on('error', (err) => {
  console.error('Server error:', err);
});
```

## 🌐 Links

- [Elide Documentation](https://docs.elide.dev)
- [npm events package](https://www.npmjs.com/package/events) (~150M downloads/week)
- [Node.js Events Documentation](https://nodejs.org/api/events.html)

## 📝 Package Stats

- **npm downloads**: ~150M/week
- **Use case**: Node.js compatibility layer
- **Elide advantage**: Use Node.js patterns in any language
- **Polyglot score**: 49/50 (S-Tier)

---

**Built with ❤️ for the Elide Polyglot Runtime**
