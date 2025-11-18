# CountUp.js

Number counter animation for Elide (polyglot!)

Based on https://www.npmjs.com/package/countup.js (~100K+ downloads/week)

## Features

- Number animations
- Decimal support
- Custom formatting
- Easing functions
- Prefix/suffix
- Zero dependencies

## Quick Start

```typescript
import CountUp from './elide-countup.js.ts';

const counter = new CountUp(element, 1234, {
  duration: 2,
  prefix: '$',
  suffix: ' USD',
  decimalPlaces: 2,
});

counter.start();
```

## Polyglot Examples

### JavaScript/TypeScript
```typescript
import CountUp from './elide-countup.js.ts';
new CountUp({}, 1000).start();
```

### Python (via Elide)
```python
from elide_countup_js import CountUp
CountUp({}, 1000).start()
```

### Ruby (via Elide)
```ruby
require 'elide/countup_js'
CountUp.new({}, 1000).start
```

### Java (via Elide)
```java
import elide.countup_js.*;
new CountUp(element, 1000).start();
```

## Benefits

- One counter library for ALL languages on Elide
- Consistent number formatting across platforms
- Perfect for statistics and dashboards
- ~100K+ downloads/week on npm!
