# JavaScript Task Runner

JavaScript Task Runner for Elide (polyglot!)

Based on https://www.npmjs.com/package/grunt (~300K+ downloads/week)

## Features

- Config-driven tasks
- Multi-task support
- File globbing
- Zero dependencies

## Quick Start

```typescript
import grunt from './elide-grunt.ts';

// Basic operations
grunt.set('key', 'value');
console.log(grunt.get('key'));

// Event handling
grunt.on('change', (key) => {
  console.log(`Changed: ${key}`);
});
```

## Polyglot Examples

### JavaScript/TypeScript
```typescript
import grunt from './elide-grunt.ts';

grunt.set('data', { foo: 'bar' });
```

### Python (via Elide)
```python
from elide_grunt import grunt

grunt.set('data', {'foo': 'bar'})
```

### Ruby (via Elide)
```ruby
require 'elide/grunt'

grunt.set('data', { foo: 'bar' })
```

### Java (via Elide)
```java
import elide.grunt.*;

Grunt.set("data", Map.of("foo", "bar"));
```

## Benefits

- One javascript task runner for ALL languages on Elide
- Consistent API across languages
- Share across your polyglot stack
- ~300K+ downloads/week on npm!
