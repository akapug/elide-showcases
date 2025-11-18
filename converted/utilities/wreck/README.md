# Wreck HTTP Client

Wreck HTTP Client for Elide (polyglot!)

Based on https://www.npmjs.com/package/wreck (~200K+ downloads/week)

## Features

- Hapi integration
- Payload parsing
- Read/get methods
- Error handling
- Zero dependencies

## Quick Start

```typescript
import wreck from './elide-wreck.ts';

// Basic usage
const result = wreck.main();
console.log(result);
```

## Polyglot Examples

### JavaScript/TypeScript
```typescript
import wreck from './elide-wreck.ts';
const result = wreck.main();
```

### Python (via Elide)
```python
from elide_wreck import wreck
result = wreck.main()
```

### Ruby (via Elide)
```ruby
require 'elide/wreck'
result = wreck.main
```

### Java (via Elide)
```java
import elide.wreck.*;
String result = Wreck_HTTP_Client.main();
```

## Benefits

- One library for ALL languages on Elide
- Consistent API across languages
- ~200K+ downloads/week on npm!
