# Observable

Observable Pattern Implementation for Elide (polyglot!)

Based on https://www.npmjs.com/package/observable (~100K+ downloads/week)

## Features

- Observable pattern
- Subscribe/unsubscribe
- Map and filter operators
- Error handling
- Zero dependencies

## Quick Start

```typescript
import { Observable } from './elide-observable.ts';

// Create observable
const obs = new Observable<number>((observer) => {
  observer.next(1);
  observer.next(2);
  observer.next(3);
  observer.complete();
});

// Subscribe
obs.subscribe({
  next: (value) => console.log('Value:', value),
  complete: () => console.log('Done!')
});

// From array
const fromArray = Observable.from([1, 2, 3]);

// Map and filter
Observable.from([1, 2, 3, 4, 5])
  .map(x => x * 2)
  .filter(x => x > 5)
  .subscribe(value => console.log(value));
```

## Polyglot Examples

### JavaScript/TypeScript
```typescript
import { Observable } from './elide-observable.ts';

const stream = Observable.from([1, 2, 3])
  .map(x => x * 2);

stream.subscribe(value => console.log(value));
```

### Python (via Elide)
```python
from elide_observable import Observable

obs = Observable.from_list([1, 2, 3]).map(lambda x: x * 2)
obs.subscribe(lambda x: print(x))
```

### Ruby (via Elide)
```ruby
require 'elide/observable'

obs = Observable.from([1, 2, 3]).map { |x| x * 2 }
obs.subscribe { |x| puts x }
```

### Java (via Elide)
```java
import elide.observable.*;

Observable<Integer> obs = Observable.from(List.of(1, 2, 3))
  .map(x -> x * 2);
obs.subscribe(x -> System.out.println(x));
```

## Benefits

- One observable pattern for ALL languages on Elide
- Consistent reactive programming
- Share data streams across stack
- ~100K+ downloads/week on npm!
