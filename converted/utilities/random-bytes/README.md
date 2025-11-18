# Random Bytes

Cryptographically secure random bytes generator for Elide (polyglot!)

Based on https://www.npmjs.com/package/random-bytes (~2M+ downloads/week)

## Features

- Cryptographically secure random bytes
- Sync and async generation
- Buffer output
- Hex and base64 string output
- Zero dependencies

## Quick Start

```typescript
import { randomBytes, randomBytesHex } from './elide-random-bytes.ts';

// Generate random bytes
const bytes = randomBytes(16);
console.log(bytes.toString('hex'));

// Generate as hex string
const hex = randomBytesHex(32);
console.log(hex);
```

## Polyglot Examples

### JavaScript/TypeScript
```typescript
import { randomBytes } from './elide-random-bytes.ts';

const token = randomBytes(32).toString('hex');
```

### Python (via Elide)
```python
from elide_random_bytes import random_bytes

token = random_bytes(32).to_string('hex')
```

### Ruby (via Elide)
```ruby
require 'elide/random_bytes'

token = random_bytes(32).to_string('hex')
```

### Java (via Elide)
```java
import elide.random_bytes.*;

String token = RandomBytes.randomBytes(32).toString("hex");
```

## Benefits

- One random bytes library for ALL languages on Elide
- Consistent security across languages
- Share security primitives across your polyglot stack
- ~2M+ downloads/week on npm!
