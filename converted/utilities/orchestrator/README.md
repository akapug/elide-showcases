# Task Orchestration

Task Orchestration for Elide (polyglot!)

Based on https://www.npmjs.com/package/orchestrator (~100K+ downloads/week)

## Features

- Task sequencing
- Parallel execution
- Event emitter
- Zero dependencies

## Quick Start

```typescript
import orchestrator from './elide-orchestrator.ts';

// Basic operations
orchestrator.set('key', 'value');
console.log(orchestrator.get('key'));

// Event handling
orchestrator.on('change', (key) => {
  console.log(`Changed: ${key}`);
});
```

## Polyglot Examples

### JavaScript/TypeScript
```typescript
import orchestrator from './elide-orchestrator.ts';

orchestrator.set('data', { foo: 'bar' });
```

### Python (via Elide)
```python
from elide_orchestrator import orchestrator

orchestrator.set('data', {'foo': 'bar'})
```

### Ruby (via Elide)
```ruby
require 'elide/orchestrator'

orchestrator.set('data', { foo: 'bar' })
```

### Java (via Elide)
```java
import elide.orchestrator.*;

Orchestrator.set("data", Map.of("foo", "bar"));
```

## Benefits

- One task orchestration for ALL languages on Elide
- Consistent API across languages
- Share across your polyglot stack
- ~100K+ downloads/week on npm!
