# RandomBytes

Cryptographically secure random bytes for Elide (polyglot!)

Based on https://www.npmjs.com/package/randombytes (~10M+ downloads/week)

## Features

- Cryptographically secure PRNG
- Browser and Node.js compatible
- Fast random generation
- Multiple output formats
- Zero dependencies

## Quick Start

```typescript
import randombytes from './elide-randombytes.ts';

// Generate random bytes
const bytes = randombytes(32);
console.log(bytes.toString('hex'));
```

## Polyglot Examples

### JavaScript/TypeScript
```typescript
import randombytes from './elide-randombytes.ts';

const key = randombytes(32).toString('hex');
```

### Python (via Elide)
```python
from elide_randombytes import randombytes

key = randombytes(32).to_string('hex')
```

### Ruby (via Elide)
```ruby
require 'elide/randombytes'

key = randombytes(32).to_string('hex')
```

### Java (via Elide)
```java
import elide.randombytes.*;

String key = Randombytes.randombytes(32).toString("hex");
```

## Benefits

- One crypto random library for ALL languages on Elide
- Consistent security across languages
- Share crypto primitives across your polyglot stack
- ~10M+ downloads/week on npm!
