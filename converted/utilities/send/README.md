# Send - File Streaming

Send - File Streaming for Elide (polyglot!)

Based on https://www.npmjs.com/package/send (~5M+ downloads/week)

## Features

- File streaming
- Range support
- ETag generation
- Error handling
- Zero dependencies

## Quick Start

```typescript
import send from './elide-send.ts';

// Basic usage
const result = send.main();
console.log(result);
```

## Polyglot Examples

### JavaScript/TypeScript
```typescript
import send from './elide-send.ts';
const result = send.main();
```

### Python (via Elide)
```python
from elide_send import send
result = send.main()
```

### Ruby (via Elide)
```ruby
require 'elide/send'
result = send.main
```

### Java (via Elide)
```java
import elide.send.*;
String result = Send___File_Streaming.main();
```

## Benefits

- One library for ALL languages on Elide
- Consistent API across languages
- ~5M+ downloads/week on npm!
