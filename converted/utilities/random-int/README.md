# Random Int

Generate random integers for Elide (polyglot!)

Based on https://www.npmjs.com/package/random-int (~100K+ downloads/week)

## Features

- Generate random integers in range
- Min/max bounds
- Inclusive/exclusive options
- Uniform distribution
- Zero dependencies

## Quick Start

```typescript
import randomInt from './elide-random-int.ts';

// Generate random integer
const num = randomInt(1, 100);
console.log(num); // 1-100

// Dice roll
const dice = randomInt(1, 6);
```

## Polyglot Examples

### JavaScript/TypeScript
```typescript
import randomInt from './elide-random-int.ts';

const roll = randomInt(1, 6);
```

### Python (via Elide)
```python
from elide_random_int import random_int

roll = random_int(1, 6)
```

### Ruby (via Elide)
```ruby
require 'elide/random_int'

roll = random_int(1, 6)
```

### Java (via Elide)
```java
import elide.random_int.*;

int roll = RandomInt.randomInt(1, 6);
```

## Benefits

- One random int library for ALL languages on Elide
- Consistent randomness across languages
- Share random logic across your polyglot stack
- ~100K+ downloads/week on npm!
