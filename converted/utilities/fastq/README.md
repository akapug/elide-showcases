# Fast Queue

Fast Queue for Elide (polyglot!)

Based on https://www.npmjs.com/package/fastq (~2M+ downloads/week)

## Features

- High performance
- Worker pool
- Async support
- Zero dependencies

## Quick Start

```typescript
import fastq from './elide-fastq.ts';

// Basic operations
fastq.set('key', 'value');
console.log(fastq.get('key'));

// Event handling
fastq.on('change', (key) => {
  console.log(`Changed: ${key}`);
});
```

## Polyglot Examples

### JavaScript/TypeScript
```typescript
import fastq from './elide-fastq.ts';

fastq.set('data', { foo: 'bar' });
```

### Python (via Elide)
```python
from elide_fastq import fastq

fastq.set('data', {'foo': 'bar'})
```

### Ruby (via Elide)
```ruby
require 'elide/fastq'

fastq.set('data', { foo: 'bar' })
```

### Java (via Elide)
```java
import elide.fastq.*;

Fastq.set("data", Map.of("foo", "bar"));
```

## Benefits

- One fast queue for ALL languages on Elide
- Consistent API across languages
- Share across your polyglot stack
- ~2M+ downloads/week on npm!
