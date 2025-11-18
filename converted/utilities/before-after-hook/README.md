# Before-After-Hook - Hook Pattern Implementation

Asynchronous before/after hook pattern for wrapping method calls.

Based on [before-after-hook](https://www.npmjs.com/package/before-after-hook) (~2M+ downloads/week)

## Features

- Before/after hooks
- Error hooks
- Async/await support
- Multiple hooks
- Hook removal
- Zero dependencies

## Quick Start

```typescript
import { createHook } from './elide-before-after-hook.ts';

const hook = createHook();

hook.before('save', async (options) => {
  console.log('Validating...');
});

hook.after('save', async (result, options) => {
  console.log('Saved!', result);
});

const save = hook.wrap('save', async (options) => {
  return { id: 1, ...options };
});

await save({ name: 'Alice' });
```

## Polyglot Examples

**JavaScript/TypeScript:**
```typescript
const hook = createHook();
hook.before('method', (opts) => console.log(opts));
const wrapped = hook.wrap('method', async () => {});
```

**Python (via Elide):**
```python
hook = create_hook()
hook.before('method', lambda opts: print(opts))
wrapped = hook.wrap('method', lambda: None)
```

**Ruby (via Elide):**
```ruby
hook = create_hook
hook.before('method') { |opts| puts opts }
wrapped = hook.wrap('method') { }
```

## Why Polyglot?

- Same hook pattern across all languages
- Wrap methods consistently
- Share interception logic
- Universal before/after/error handling
