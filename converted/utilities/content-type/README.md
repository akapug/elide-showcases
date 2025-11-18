# Content-Type Parser

Content-Type Parser for Elide (polyglot!)

Based on https://www.npmjs.com/package/content-type (~15M+ downloads/week)

## Features

- Header parsing
- Charset handling
- Media type parsing
- Format creation
- Zero dependencies

## Quick Start

```typescript
import content-type from './elide-content-type.ts';

// Basic usage
const result = content-type.main();
console.log(result);
```

## Polyglot Examples

### JavaScript/TypeScript
```typescript
import content-type from './elide-content-type.ts';
const result = content-type.main();
```

### Python (via Elide)
```python
from elide_content-type import content-type
result = content-type.main()
```

### Ruby (via Elide)
```ruby
require 'elide/content-type'
result = content-type.main
```

### Java (via Elide)
```java
import elide.content-type.*;
String result = Content_Type_Parser.main();
```

## Benefits

- One library for ALL languages on Elide
- Consistent API across languages
- ~15M+ downloads/week on npm!
