# Motion One

Tiny animation library for Elide (polyglot!)

Based on https://www.npmjs.com/package/motion-one (~50K+ downloads/week)

## Features

- Minimal bundle size (3.8kb)
- Web Animations API
- Spring animations
- Scroll animations
- Timeline support
- Zero dependencies

## Quick Start

```typescript
import { animate, spring, stagger } from './elide-motion-one.ts';

// Basic animation
animate({}, { opacity: [0, 1] }, { duration: 1000 });

// Spring animation
animate({}, { x: [0, 100] }, { easing: spring() });

// Stagger effect
animate({}, { scale: [0, 1] }, { delay: stagger(50) });
```

## Polyglot Examples

### JavaScript/TypeScript
```typescript
import { animate } from './elide-motion-one.ts';
animate({}, { x: [0, 100] });
```

### Python (via Elide)
```python
from elide_motion_one import animate
animate({}, {'x': [0, 100]})
```

### Ruby (via Elide)
```ruby
require 'elide/motion_one'
animate({}, { x: [0, 100] })
```

### Java (via Elide)
```java
import elide.motion_one.*;
MotionOne.animate(Map.of("x", List.of(0, 100)));
```

## Benefits

- Smallest animation library (3.8kb)
- One library for ALL languages on Elide
- Consistent API across platforms
- ~50K+ downloads/week on npm!
