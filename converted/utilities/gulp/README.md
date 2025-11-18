# Streaming Build System

Streaming Build System for Elide (polyglot!)

Based on https://www.npmjs.com/package/gulp (~500K+ downloads/week)

## Features

- Task composition
- File watching
- Streaming transforms
- Zero dependencies

## Quick Start

```typescript
import gulp from './elide-gulp.ts';

// Basic operations
gulp.set('key', 'value');
console.log(gulp.get('key'));

// Event handling
gulp.on('change', (key) => {
  console.log(`Changed: ${key}`);
});
```

## Polyglot Examples

### JavaScript/TypeScript
```typescript
import gulp from './elide-gulp.ts';

gulp.set('data', { foo: 'bar' });
```

### Python (via Elide)
```python
from elide_gulp import gulp

gulp.set('data', {'foo': 'bar'})
```

### Ruby (via Elide)
```ruby
require 'elide/gulp'

gulp.set('data', { foo: 'bar' })
```

### Java (via Elide)
```java
import elide.gulp.*;

Gulp.set("data", Map.of("foo", "bar"));
```

## Benefits

- One streaming build system for ALL languages on Elide
- Consistent API across languages
- Share across your polyglot stack
- ~500K+ downloads/week on npm!
