# Error Handling

Error Handling for Elide (polyglot!)

Based on https://www.npmjs.com/package/plugin-error (~300K+ downloads/week)

## Features

- Plugin errors
- Stack traces
- Error formatting
- Zero dependencies

## Quick Start

```typescript
import plugin_error from './elide-plugin-error.ts';

// Basic operations
plugin_error.set('key', 'value');
console.log(plugin_error.get('key'));

// Event handling
plugin_error.on('change', (key) => {
  console.log(`Changed: ${key}`);
});
```

## Polyglot Examples

### JavaScript/TypeScript
```typescript
import plugin_error from './elide-plugin-error.ts';

plugin_error.set('data', { foo: 'bar' });
```

### Python (via Elide)
```python
from elide_plugin_error import plugin_error

plugin_error.set('data', {'foo': 'bar'})
```

### Ruby (via Elide)
```ruby
require 'elide/plugin_error'

plugin_error.set('data', { foo: 'bar' })
```

### Java (via Elide)
```java
import elide.plugin_error.*;

PluginError.set("data", Map.of("foo", "bar"));
```

## Benefits

- One error handling for ALL languages on Elide
- Consistent API across languages
- Share across your polyglot stack
- ~300K+ downloads/week on npm!
