# EventEmitter2 - Enhanced Event Emitter - Elide Polyglot Showcase

> **Namespaced events for ALL languages** - TypeScript, Python, Ruby, and Java

## ✨ Features

- ✅ Namespaced events with delimiters
- ✅ Wildcard event matching
- ✅ Array event names
- ✅ **Polyglot**: Use from TypeScript, Python, Ruby, and Java

## 🚀 Quick Start

```typescript
import EventEmitter2 from './elide-eventemitter2.ts';

const emitter = new EventEmitter2({ delimiter: '.', wildcard: true });

emitter.on('user.login', (name) => {
  console.log(`User logged in: ${name}`);
});

emitter.on('user.*', (name) => {
  console.log(`User event: ${name}`);
});

emitter.emit('user.login', 'Alice');
```

## 📝 Package Stats

- **npm downloads**: ~15M/week
- **Polyglot score**: 46/50 (A-Tier)

---

**Built with ❤️ for the Elide Polyglot Runtime**
