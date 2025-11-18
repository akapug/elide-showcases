# AOS

Animate On Scroll library for Elide (polyglot!)

Based on https://www.npmjs.com/package/aos (~200K+ downloads/week)

## Features

- Scroll animations
- Multiple animation types
- Customizable delays
- Anchor placements
- Easing functions
- Zero dependencies

## Quick Start

```typescript
import AOS from './elide-aos.ts';

AOS.init({
  duration: 800,
  once: true,
  offset: 120,
});

// Refresh after dynamic content
AOS.refresh();
```

## Polyglot Examples

### JavaScript/TypeScript
```typescript
import AOS from './elide-aos.ts';
AOS.init({ duration: 800 });
```

### Python (via Elide)
```python
from elide_aos import AOS
AOS.init(duration=800)
```

### Ruby (via Elide)
```ruby
require 'elide/aos'
AOS.init(duration: 800)
```

### Java (via Elide)
```java
import elide.aos.*;
AOS.init(800);
```

## Benefits

- One scroll animation library for ALL languages on Elide
- Consistent reveal effects across platforms
- Perfect for landing pages and marketing
- ~200K+ downloads/week on npm!
