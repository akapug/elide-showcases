# Hookable - Async Hooks System

Awaitable hooks system for parallel and serial async/await code.

Based on [hookable](https://www.npmjs.com/package/hookable) (~500K+ downloads/week)

## Features

- Async/await hooks
- Serial and parallel execution
- Hook priority
- Once hooks
- Hook removal
- Zero dependencies

## Quick Start

```typescript
import { createHooks } from './elide-hookable.ts';

const hooks = createHooks();

// Register hooks
hooks.hook('build:start', async () => {
  console.log('Building...');
});

// Call hooks
await hooks.callHook('build:start');

// Parallel execution
await hooks.callHookParallel('compile');
```

## Polyglot Examples

**JavaScript/TypeScript:**
```typescript
const hooks = createHooks();
hooks.hook('event', () => console.log('fired'));
await hooks.callHook('event');
```

**Python (via Elide):**
```python
hooks = create_hooks()
hooks.hook('event', lambda: print('fired'))
await hooks.call_hook('event')
```

**Ruby (via Elide):**
```ruby
hooks = create_hooks
hooks.hook('event') { puts 'fired' }
hooks.call_hook('event')
```

## Why Polyglot?

- Modern async hooks across all languages
- Share lifecycle management
- Parallel and serial execution
- Consistent event handling
