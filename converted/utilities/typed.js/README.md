# Typed.js

Typing animation library for Elide (polyglot!)

Based on https://www.npmjs.com/package/typed.js (~100K+ downloads/week)

## Features

- Typing effect
- Backspace effect
- Multiple strings
- Smart backspace
- Cursor blinking
- Zero dependencies

## Quick Start

```typescript
import Typed from './elide-typed.js.ts';

const typed = new Typed(element, {
  strings: ['Hello World!', 'Welcome to Elide!'],
  typeSpeed: 50,
  backSpeed: 30,
  loop: true,
  showCursor: true,
});
```

## Polyglot Examples

### JavaScript/TypeScript
```typescript
import Typed from './elide-typed.js.ts';
new Typed({}, { strings: ['Hello!'] });
```

### Python (via Elide)
```python
from elide_typed_js import Typed
Typed({}, strings=['Hello!'])
```

### Ruby (via Elide)
```ruby
require 'elide/typed_js'
Typed.new({}, strings: ['Hello!'])
```

### Java (via Elide)
```java
import elide.typed_js.*;
new Typed(element, List.of("Hello!"));
```

## Benefits

- One typing library for ALL languages on Elide
- Consistent typing effects across platforms
- Perfect for landing pages and marketing
- ~100K+ downloads/week on npm!
