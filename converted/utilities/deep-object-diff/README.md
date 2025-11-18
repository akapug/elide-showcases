# Deep Object Diff - Detailed Object Differences

Find detailed differences between objects on Elide.

## Features

- Detailed object comparison
- Added/deleted/updated tracking
- Nested object support
- Simple API
- Zero dependencies

## Quick Start

```typescript
import { diff, detailedDiff, addedDiff, deletedDiff, updatedDiff } from './elide-deep-object-diff.ts';

// Basic diff
const changes = diff(obj1, obj2);

// Detailed breakdown
const { added, deleted, updated } = detailedDiff(obj1, obj2);
```

## Polyglot Examples

```python
# Python
from elide_deep_object_diff import diff, detailed_diff
changes = diff(obj1, obj2)
```

```ruby
# Ruby
require 'elide_deep_object_diff'
changes = diff(obj1, obj2)
```

Based on https://www.npmjs.com/package/deep-object-diff (~300K+ downloads/week)
