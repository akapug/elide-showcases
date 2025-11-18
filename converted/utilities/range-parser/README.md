# Range Parser

Range Parser for Elide (polyglot!)

Based on https://www.npmjs.com/package/range-parser (~10M+ downloads/week)

## Features

- Range header parsing
- Byte range support
- Multi-range
- Standards compliant
- Zero dependencies

## Quick Start

```typescript
import range-parser from './elide-range-parser.ts';

// Basic usage
const result = range-parser.main();
console.log(result);
```

## Polyglot Examples

### JavaScript/TypeScript
```typescript
import range-parser from './elide-range-parser.ts';
const result = range-parser.main();
```

### Python (via Elide)
```python
from elide_range-parser import range-parser
result = range-parser.main()
```

### Ruby (via Elide)
```ruby
require 'elide/range-parser'
result = range-parser.main
```

### Java (via Elide)
```java
import elide.range-parser.*;
String result = Range_Parser.main();
```

## Benefits

- One library for ALL languages on Elide
- Consistent API across languages
- ~10M+ downloads/week on npm!
