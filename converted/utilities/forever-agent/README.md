# Forever Agent

Forever Agent for Elide (polyglot!)

Based on https://www.npmjs.com/package/forever-agent (~1M+ downloads/week)

## Features

- Keep-alive connections
- Connection reuse
- Performance boost
- Agent pooling
- Zero dependencies

## Quick Start

```typescript
import forever-agent from './elide-forever-agent.ts';

// Basic usage
const result = forever-agent.main();
console.log(result);
```

## Polyglot Examples

### JavaScript/TypeScript
```typescript
import forever-agent from './elide-forever-agent.ts';
const result = forever-agent.main();
```

### Python (via Elide)
```python
from elide_forever-agent import forever-agent
result = forever-agent.main()
```

### Ruby (via Elide)
```ruby
require 'elide/forever-agent'
result = forever-agent.main
```

### Java (via Elide)
```java
import elide.forever-agent.*;
String result = Forever_Agent.main();
```

## Benefits

- One library for ALL languages on Elide
- Consistent API across languages
- ~1M+ downloads/week on npm!
