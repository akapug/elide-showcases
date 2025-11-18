# Virtual File System

Virtual File System for Elide (polyglot!)

Based on https://www.npmjs.com/package/vinyl-fs (~500K+ downloads/week)

## Features

- File streaming
- Glob support
- Symlink handling
- Zero dependencies

## Quick Start

```typescript
import vinyl_fs from './elide-vinyl-fs.ts';

// Basic operations
vinyl_fs.set('key', 'value');
console.log(vinyl_fs.get('key'));

// Event handling
vinyl_fs.on('change', (key) => {
  console.log(`Changed: ${key}`);
});
```

## Polyglot Examples

### JavaScript/TypeScript
```typescript
import vinyl_fs from './elide-vinyl-fs.ts';

vinyl_fs.set('data', { foo: 'bar' });
```

### Python (via Elide)
```python
from elide_vinyl_fs import vinyl_fs

vinyl_fs.set('data', {'foo': 'bar'})
```

### Ruby (via Elide)
```ruby
require 'elide/vinyl_fs'

vinyl_fs.set('data', { foo: 'bar' })
```

### Java (via Elide)
```java
import elide.vinyl_fs.*;

VinylFs.set("data", Map.of("foo", "bar"));
```

## Benefits

- One virtual file system for ALL languages on Elide
- Consistent API across languages
- Share across your polyglot stack
- ~500K+ downloads/week on npm!
