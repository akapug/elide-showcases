# Deep Diff - Deep Object Diffing

Deep diff between two objects with detailed change tracking on Elide.

## Features

- Deep object comparison
- Track edits, adds, deletes
- Array change detection
- Path tracking for changes
- Apply/revert changes
- Zero dependencies

## Quick Start

```typescript
import diff, { applyChange, revertChange } from './elide-deep-diff.ts';

// Find differences
const changes = diff(obj1, obj2);
console.log(changes);

// Apply changes
changes?.forEach(change => applyChange(target, null, change));

// Revert changes
changes?.forEach(change => revertChange(target, null, change));
```

## Polyglot Examples

```python
# Python
from elide_deep_diff import diff
changes = diff(obj1, obj2)
```

```ruby
# Ruby
require 'elide_deep_diff'
changes = diff(obj1, obj2)
```

```java
// Java
import elide.DeepDiff;
var changes = DeepDiff.diff(obj1, obj2);
```

Based on https://www.npmjs.com/package/deep-diff (~500K+ downloads/week)
