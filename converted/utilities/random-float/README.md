# Random Float

Generate random floating point numbers for Elide (polyglot!)

Based on https://www.npmjs.com/package/random-float (~50K+ downloads/week)

## Features

- Generate random floats in range
- Min/max bounds
- Precision control
- Uniform distribution
- Zero dependencies

## Quick Start

```typescript
import randomFloat from './elide-random-float.ts';

// Generate random float
const num = randomFloat(0, 100);
console.log(num);

// With precision
const precise = randomFloat(0, 1).toFixed(2);
```

## Polyglot Examples

### JavaScript/TypeScript
```typescript
import randomFloat from './elide-random-float.ts';

const value = randomFloat(0, 10);
```

### Python (via Elide)
```python
from elide_random_float import random_float

value = random_float(0, 10)
```

### Ruby (via Elide)
```ruby
require 'elide/random_float'

value = random_float(0, 10)
```

### Java (via Elide)
```java
import elide.random_float.*;

double value = RandomFloat.randomFloat(0, 10);
```

## Benefits

- One random float library for ALL languages on Elide
- Consistent randomness across languages
- Share random logic across your polyglot stack
- ~50K+ downloads/week on npm!
