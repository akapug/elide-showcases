# Exit-Hook - Run Code When Process Exits

Run some code when the process exits.

Based on [exit-hook](https://www.npmjs.com/package/exit-hook) (~1M+ downloads/week)

## Features

- Exit event handling
- Async cleanup support
- Multiple hooks
- Signal handling
- Graceful shutdown
- Zero dependencies

## Quick Start

```typescript
import exitHook from './elide-exit-hook.ts';

// Simple cleanup
exitHook(() => {
  console.log('Cleaning up...');
});

// Async cleanup
exitHook(async () => {
  await database.close();
  await server.shutdown();
});
```

## Polyglot Examples

**JavaScript/TypeScript:**
```typescript
exitHook(async () => {
  await db.close();
});
```

**Python (via Elide):**
```python
exit_hook(lambda: db.close())
```

**Ruby (via Elide):**
```ruby
exit_hook { db.close }
```

## Why Polyglot?

- Same exit handling across all languages
- Async cleanup support
- Share shutdown patterns
- Consistent teardown logic
