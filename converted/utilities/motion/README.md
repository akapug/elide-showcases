# Motion

Modern web animations library for Elide (polyglot!)

Based on https://www.npmjs.com/package/motion (~100K+ downloads/week)

## Features

- CSS animations
- Keyframe animations
- Easing functions
- Animation sequences
- Timeline control
- Zero dependencies

## Quick Start

```typescript
import { animate, easings } from './elide-motion.ts';

// Basic animation
animate(0, 100, {
  duration: 1000,
  easing: easings.easeInOut,
  onUpdate: (value) => console.log(value),
  onComplete: () => console.log('Done!'),
});

// Timeline
import { Timeline } from './elide-motion.ts';
const timeline = new Timeline();
timeline.add(animation1).add(animation2, 500).play();
```

## Polyglot Examples

### JavaScript/TypeScript
```typescript
import { animate } from './elide-motion.ts';
animate(0, 100, { duration: 1000 });
```

### Python (via Elide)
```python
from elide_motion import animate
animate(0, 100, duration=1000)
```

### Ruby (via Elide)
```ruby
require 'elide/motion'
animate(0, 100, duration: 1000)
```

### Java (via Elide)
```java
import elide.motion.*;
Motion.animate(0, 100, 1000);
```

## Benefits

- One animation library for ALL languages on Elide
- Consistent easing functions across platforms
- Share animation configs across your polyglot stack
- ~100K+ downloads/week on npm!
