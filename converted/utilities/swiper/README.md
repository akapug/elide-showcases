# Swiper

Modern mobile touch slider for Elide (polyglot!)

Based on https://www.npmjs.com/package/swiper (~1M+ downloads/week)

## Features

- Touch/swipe support
- Multiple slide layouts
- Pagination
- Navigation arrows
- Autoplay
- Zero dependencies

## Quick Start

```typescript
import Swiper from './elide-swiper.ts';

const swiper = new Swiper(container, {
  slidesPerView: 1,
  spaceBetween: 10,
  loop: true,
  autoplay: { delay: 3000 },
});
```

## Polyglot Examples

### JavaScript/TypeScript
```typescript
import Swiper from './elide-swiper.ts';
new Swiper({}, { loop: true });
```

### Python (via Elide)
```python
from elide_swiper import Swiper
Swiper({}, loop=True)
```

### Ruby (via Elide)
```ruby
require 'elide/swiper'
Swiper.new({}, loop: true)
```

### Java (via Elide)
```java
import elide.swiper.*;
new Swiper(container, true);
```

## Benefits

- One slider library for ALL languages on Elide
- Consistent slider behavior across platforms
- ~1M+ downloads/week on npm!
