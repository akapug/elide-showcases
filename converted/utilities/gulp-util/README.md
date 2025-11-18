# Gulp Utilities

Gulp Utilities for Elide (polyglot!)

Based on https://www.npmjs.com/package/gulp-util (~200K+ downloads/week)

## Features

- Plugin helpers
- Logging
- File utilities
- Zero dependencies

## Quick Start

```typescript
import gulp_util from './elide-gulp-util.ts';

// Basic operations
gulp_util.set('key', 'value');
console.log(gulp_util.get('key'));

// Event handling
gulp_util.on('change', (key) => {
  console.log(`Changed: ${key}`);
});
```

## Polyglot Examples

### JavaScript/TypeScript
```typescript
import gulp_util from './elide-gulp-util.ts';

gulp_util.set('data', { foo: 'bar' });
```

### Python (via Elide)
```python
from elide_gulp_util import gulp_util

gulp_util.set('data', {'foo': 'bar'})
```

### Ruby (via Elide)
```ruby
require 'elide/gulp_util'

gulp_util.set('data', { foo: 'bar' })
```

### Java (via Elide)
```java
import elide.gulp_util.*;

GulpUtil.set("data", Map.of("foo", "bar"));
```

## Benefits

- One gulp utilities for ALL languages on Elide
- Consistent API across languages
- Share across your polyglot stack
- ~200K+ downloads/week on npm!
