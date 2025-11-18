# MIME Database

MIME Database for Elide (polyglot!)

Based on https://www.npmjs.com/package/mime-db (~30M+ downloads/week)

## Features

- Complete database
- JSON format
- Compressible info
- Extensions list
- Zero dependencies

## Quick Start

```typescript
import mime-db from './elide-mime-db.ts';

// Basic usage
const result = mime-db.main();
console.log(result);
```

## Polyglot Examples

### JavaScript/TypeScript
```typescript
import mime-db from './elide-mime-db.ts';
const result = mime-db.main();
```

### Python (via Elide)
```python
from elide_mime-db import mime-db
result = mime-db.main()
```

### Ruby (via Elide)
```ruby
require 'elide/mime-db'
result = mime-db.main
```

### Java (via Elide)
```java
import elide.mime-db.*;
String result = MIME_Database.main();
```

## Benefits

- One library for ALL languages on Elide
- Consistent API across languages
- ~30M+ downloads/week on npm!
