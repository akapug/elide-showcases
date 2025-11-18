# Just Debounce - Function Debouncing Utility

Debounce function calls - delay execution until after wait time has elapsed since the last invocation.

Based on [just-debounce](https://www.npmjs.com/package/just-debounce) (~50K+ downloads/week)

## Features

- ⏱️ Simple debounce implementation
- ⚙️ Configurable wait time
- 🎯 Leading and trailing edge execution
- ⚡ Immediate execution option
- 🚫 Cancel pending invocations
- 📦 Zero dependencies

## Quick Start

```typescript
import { debounce } from './elide-just-debounce.ts';

// Basic debounce
const log = debounce(() => console.log('Hello!'), 300);
log(); // Will execute after 300ms of inactivity

// Search input
const search = debounce((query: string) => {
  fetchResults(query);
}, 500);

search('h');
search('he');
search('hel'); // Only this final call executes after 500ms

// Leading edge execution
const immediate = debounce(
  () => console.log('Immediate!'),
  100,
  { leading: true, trailing: false }
);
immediate(); // Executes immediately

// Cancel pending
const cancellable = debounce(() => console.log('Never runs'), 1000);
cancellable();
cancellable.cancel(); // Cancels execution

// Flush immediately
const flushable = debounce(() => console.log('Flushed!'), 1000);
flushable();
flushable.flush(); // Executes immediately instead of waiting
```

## Polyglot Examples

### JavaScript/TypeScript
```typescript
const autoSave = debounce((content: string) => {
  saveToDatabase(content);
}, 1000);
```

### Python (via Elide)
```python
from elide_just_debounce import debounce

auto_save = debounce(lambda content: save_to_database(content), 1000)
```

### Ruby (via Elide)
```ruby
require 'elide/just_debounce'

auto_save = Debounce.new(-> (content) { save_to_database(content) }, 1000)
```

### Java (via Elide)
```java
import elide.justdebounce.Debounce;

var autoSave = Debounce.create(content -> saveToDatabase(content), 1000);
```

## Use Cases

- **Search inputs** - Wait for user to finish typing before searching
- **Window resize** - Debounce expensive layout recalculations
- **API rate limiting** - Prevent excessive API calls
- **Auto-save** - Save after user stops editing
- **Form validation** - Validate after user finishes input
- **Scroll handlers** - Debounce scroll event processing

## API

### `debounce(func, wait?, options?)`

Creates a debounced function.

**Parameters:**
- `func` - The function to debounce
- `wait` - The number of milliseconds to delay (default: 0)
- `options.leading` - Execute on the leading edge (default: false)
- `options.trailing` - Execute on the trailing edge (default: true)

**Returns:** Debounced function with `cancel()` and `flush()` methods

## Why Elide?

- 🌐 **Polyglot** - One implementation for all languages
- ⚡ **Fast** - Native performance across all platforms
- 📦 **Zero dependencies** - Pure TypeScript implementation
- 🔄 **Consistent** - Same behavior in every language
- 🚀 **Production-ready** - Battle-tested pattern

Run the demo: `elide run elide-just-debounce.ts`
