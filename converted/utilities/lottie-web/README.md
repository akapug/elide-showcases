# Lottie Web

After Effects animation player for Elide (polyglot!)

Based on https://www.npmjs.com/package/lottie-web (~500K+ downloads/week)

## Features

- After Effects animations
- JSON-based animations
- SVG/Canvas/HTML rendering
- Animation control
- Event system
- Zero dependencies

## Quick Start

```typescript
import { loadAnimation } from './elide-lottie-web.ts';

const animation = loadAnimation({
  container: document.getElementById('lottie'),
  renderer: 'svg',
  loop: true,
  autoplay: true,
  path: 'animation.json',
});

animation.play();
animation.pause();
animation.setSpeed(2);
```

## Polyglot Examples

### JavaScript/TypeScript
```typescript
import { loadAnimation } from './elide-lottie-web.ts';
const anim = loadAnimation({ loop: true });
```

### Python (via Elide)
```python
from elide_lottie_web import load_animation
anim = load_animation(loop=True)
```

### Ruby (via Elide)
```ruby
require 'elide/lottie_web'
anim = load_animation(loop: true)
```

### Java (via Elide)
```java
import elide.lottie_web.*;
Animation anim = LottieWeb.loadAnimation(true);
```

## Benefits

- One Lottie player for ALL languages on Elide
- Share AE animations across platforms
- Vector animations (scalable, tiny files)
- ~500K+ downloads/week on npm!
