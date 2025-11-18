# Callbag Basics

Basic Callbag Operators for Elide (polyglot!)

Based on https://www.npmjs.com/package/callbag-basics (~50K+ downloads/week)

## Features

- Callbag sources
- Map, filter operators
- Take, skip
- ForEach sink
- Zero dependencies

## Quick Start

```typescript
import { fromIter, map, filter, take, forEach, pipe } from './elide-callbag-basics.ts';

// Create source
const source = fromIter([1, 2, 3, 4, 5]);

// Process stream
pipe(
  source,
  map(x => x * 2),
  filter(x => x > 5),
  take(3),
  forEach(x => console.log(x))
);

// Chain operators
pipe(
  fromIter(['hello', 'world']),
  map(s => s.toUpperCase()),
  forEach(s => console.log(s))
);
```

## Polyglot Examples

### JavaScript/TypeScript
```typescript
import { fromIter, map, pipe, forEach } from './elide-callbag-basics.ts';

pipe(
  fromIter([1, 2, 3]),
  map(x => x * 2),
  forEach(x => console.log(x))
);
```

### Python (via Elide)
```python
from elide_callbag_basics import from_iter, map, pipe, for_each

pipe(
  from_iter([1, 2, 3]),
  map(lambda x: x * 2),
  for_each(lambda x: print(x))
)
```

### Ruby (via Elide)
```ruby
require 'elide/callbag_basics'

pipe(
  from_iter([1, 2, 3]),
  map { |x| x * 2 },
  for_each { |x| puts x }
)
```

### Java (via Elide)
```java
import elide.callbag_basics.*;

pipe(
  fromIter(List.of(1, 2, 3)),
  map(x -> x * 2),
  forEach(x -> System.out.println(x))
);
```

## Benefits

- One reactive library for ALL languages on Elide
- Lightweight and composable
- Share stream logic across stack
- ~50K+ downloads/week on npm!
