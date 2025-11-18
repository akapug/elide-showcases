# Signal-Exit - Process Exit Handler

Handle all the ways a Node.js process can exit.

Based on [signal-exit](https://www.npmjs.com/package/signal-exit) (~20M+ downloads/week)

## Features

- SIGINT, SIGTERM, SIGQUIT handling
- Uncaught exception handling
- Process exit handling
- Multiple handlers
- Handler removal
- Zero dependencies

## Quick Start

```typescript
import onExit from './elide-signal-exit.ts';

// Register exit handler
onExit((code, signal) => {
  console.log(`Exiting with code ${code}, signal ${signal}`);
  // Cleanup resources
});

// Removable handler
const remove = onExit((code, signal) => {
  console.log('Cleaning up...');
});

// Remove handler
remove();
```

## Polyglot Examples

**JavaScript/TypeScript:**
```typescript
onExit((code, signal) => {
  db.disconnect();
  server.close();
});
```

**Python (via Elide):**
```python
on_exit(lambda code, signal: db.disconnect())
```

**Ruby (via Elide):**
```ruby
on_exit { |code, signal| db.disconnect }
```

## Why Polyglot?

- Same exit handling across all languages
- Graceful shutdown everywhere
- Share cleanup logic
- Consistent signal handling
