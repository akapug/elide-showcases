# Vary Header

Vary Header for Elide (polyglot!)

Based on https://www.npmjs.com/package/vary (~10M+ downloads/week)

## Features

- Vary management
- Cache control
- Header merging
- Standards compliant
- Zero dependencies

## Quick Start

```typescript
import vary from './elide-vary.ts';

// Basic usage
const result = vary.main();
console.log(result);
```

## Polyglot Examples

### JavaScript/TypeScript
```typescript
import vary from './elide-vary.ts';
const result = vary.main();
```

### Python (via Elide)
```python
from elide_vary import vary
result = vary.main()
```

### Ruby (via Elide)
```ruby
require 'elide/vary'
result = vary.main
```

### Java (via Elide)
```java
import elide.vary.*;
String result = Vary_Header.main();
```

## Benefits

- One library for ALL languages on Elide
- Consistent API across languages
- ~10M+ downloads/week on npm!
