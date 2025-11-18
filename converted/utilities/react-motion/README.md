# React Motion

Spring physics animation library for Elide (polyglot!)

Based on https://www.npmjs.com/package/react-motion (~300K+ downloads/week)

## Features

- Spring physics animations
- Natural motion curves
- Chainable animations
- Stagger effects
- Velocity tracking
- Zero dependencies

## Quick Start

```typescript
import Motion, { SPRING_PRESETS } from './elide-react-motion.ts';

// Basic spring animation
const motion = new Motion(0);
motion.onChange((value) => {
  console.log(`Animated to: ${value}`);
});
motion.spring(100, SPRING_PRESETS.wobbly);

// Staggered animation
import { StaggeredMotion } from './elide-react-motion.ts';
const staggered = new StaggeredMotion(5, 100);
staggered.spring([100, 90, 80, 70, 60]);
```

## Polyglot Examples

### JavaScript/TypeScript
```typescript
import Motion from './elide-react-motion.ts';

const motion = new Motion(0);
motion.spring(100);
```

### Python (via Elide)
```python
from elide_react_motion import Motion

motion = Motion(0)
motion.spring(100)
```

### Ruby (via Elide)
```ruby
require 'elide/react_motion'

motion = Motion.new(0)
motion.spring(100)
```

### Java (via Elide)
```java
import elide.react_motion.*;

Motion motion = new Motion(0);
motion.spring(100);
```

## Benefits

- One animation library for ALL languages on Elide
- Consistent motion physics across platforms
- Share spring configs across your polyglot stack
- ~300K+ downloads/week on npm!
