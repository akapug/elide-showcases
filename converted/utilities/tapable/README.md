# Tapable - Plugin System for JavaScript

Powerful plugin and hook system used by Webpack.

Based on [tapable](https://www.npmjs.com/package/tapable) (~10M+ downloads/week)

## Features

- Multiple hook types (sync, async, waterfall)
- Interception support
- Context binding
- Dynamic hooks
- Plugin registration
- Zero dependencies

## Quick Start

```typescript
import { SyncHook, AsyncSeriesHook } from './elide-tapable.ts';

// Create hooks
const syncHook = new SyncHook(['name']);
const asyncHook = new AsyncSeriesHook(['options']);

// Register plugins
syncHook.tap('MyPlugin', (name) => {
  console.log(`Hello ${name}`);
});

asyncHook.tapPromise('AsyncPlugin', async (options) => {
  await doSomethingAsync(options);
});

// Call hooks
syncHook.call('World');
await asyncHook.promise({ debug: true });
```

## Polyglot Examples

**JavaScript/TypeScript:**
```typescript
const hook = new SyncHook(['arg']);
hook.tap('plugin', (arg) => console.log(arg));
hook.call('value');
```

**Python (via Elide):**
```python
hook = SyncHook(['arg'])
hook.tap('plugin', lambda arg: print(arg))
hook.call('value')
```

**Ruby (via Elide):**
```ruby
hook = SyncHook.new(['arg'])
hook.tap('plugin') { |arg| puts arg }
hook.call('value')
```

## Why Polyglot?

- Same plugin architecture across all languages
- Build extensible tools everywhere
- Webpack-style hooks for all
- Consistent extension points
