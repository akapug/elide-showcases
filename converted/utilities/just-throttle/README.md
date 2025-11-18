# Just Throttle - Function Throttling Utility

Throttle function calls - limit execution to once per specified time period.

Based on [just-throttle](https://www.npmjs.com/package/just-throttle) (~30K+ downloads/week)

## Features

- ⏱️ Simple throttle implementation
- ⚙️ Configurable wait time
- 🎯 Leading and trailing edge execution
- 🛡️ Guaranteed execution rate
- 🚫 Cancel pending invocations
- 📦 Zero dependencies

## Quick Start

```typescript
import { throttle } from './elide-just-throttle.ts';

// Basic throttle - max once per 300ms
const log = throttle(() => console.log('Hello!'), 300);
log(); // Executes immediately
log(); // Ignored (within 300ms)
// Wait 300ms...
log(); // Executes

// Scroll handler
const handleScroll = throttle((event) => {
  updateScrollPosition(event.scrollY);
}, 200);
window.addEventListener('scroll', handleScroll);

// API rate limiting
const fetchData = throttle((url: string) => {
  return fetch(url);
}, 1000); // Max 1 request per second

// Leading edge only
const leadingOnly = throttle(
  () => console.log('First only!'),
  100,
  { leading: true, trailing: false }
);

// Cancel throttled calls
const cancellable = throttle(() => console.log('May not run'), 1000);
cancellable();
cancellable.cancel();
```

## Polyglot Examples

### JavaScript/TypeScript
```typescript
const handleResize = throttle(() => {
  recalculateLayout();
}, 200);
```

### Python (via Elide)
```python
from elide_just_throttle import throttle

handle_resize = throttle(lambda: recalculate_layout(), 200)
```

### Ruby (via Elide)
```ruby
require 'elide/just_throttle'

handle_resize = Throttle.new(-> { recalculate_layout() }, 200)
```

### Java (via Elide)
```java
import elide.justthrottle.Throttle;

var handleResize = Throttle.create(() -> recalculateLayout(), 200);
```

## Use Cases

- **Scroll handlers** - Limit scroll event processing
- **Mouse tracking** - Reduce mousemove event frequency
- **API rate limiting** - Enforce request rate limits
- **Button clicks** - Prevent double-click submissions
- **Window resize** - Throttle expensive recalculations
- **Real-time updates** - Control update frequency

## API

### `throttle(func, wait?, options?)`

Creates a throttled function that only invokes func at most once per wait milliseconds.

**Parameters:**
- `func` - The function to throttle
- `wait` - The number of milliseconds to throttle (default: 0)
- `options.leading` - Execute on the leading edge (default: true)
- `options.trailing` - Execute on the trailing edge (default: true)

**Returns:** Throttled function with `cancel()` method

## Throttle vs Debounce

- **Throttle**: Guarantees execution at regular intervals (e.g., every 200ms)
- **Debounce**: Delays execution until activity stops (e.g., 200ms after last call)

Use throttle for continuous events (scroll, mousemove), debounce for sporadic events (search input, resize).

## Why Elide?

- 🌐 **Polyglot** - One implementation for all languages
- ⚡ **Fast** - Native performance across all platforms
- 📦 **Zero dependencies** - Pure TypeScript implementation
- 🔄 **Consistent** - Same behavior in every language
- 🚀 **Production-ready** - Battle-tested pattern

Run the demo: `elide run elide-just-throttle.ts`
