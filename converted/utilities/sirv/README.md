# sirv - Static Server

sirv - Static Server for Elide (polyglot!)

Based on https://www.npmjs.com/package/sirv (~1M+ downloads/week)

## Features

- High performance
- Tiny footprint
- Compression
- ETag/Cache headers
- Zero dependencies

## Quick Start

```typescript
import sirv from './elide-sirv.ts';

// Basic usage
const result = sirv.main();
console.log(result);
```

## Polyglot Examples

### JavaScript/TypeScript
```typescript
import sirv from './elide-sirv.ts';
const result = sirv.main();
```

### Python (via Elide)
```python
from elide_sirv import sirv
result = sirv.main()
```

### Ruby (via Elide)
```ruby
require 'elide/sirv'
result = sirv.main
```

### Java (via Elide)
```java
import elide.sirv.*;
String result = sirv___Static_Server.main();
```

## Benefits

- One library for ALL languages on Elide
- Consistent API across languages
- ~1M+ downloads/week on npm!
