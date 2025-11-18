# Fast Diff - Fast Text Diffing Algorithm

A fast diffing algorithm for plain text on Elide.

## Features

- Fast Myers diff algorithm
- Insert, delete, equal operations
- Optimized for performance
- Simple API
- Zero dependencies

## Quick Start

```typescript
import diff, { DELETE, INSERT, EQUAL, getOriginal, getNew } from './elide-fast-diff.ts';

// Basic diff
const result = diff("Hello World", "Hello Elide");
console.log(result);
// [[0, "Hello "], [-1, "World"], [1, "Elide"]]

// Get original/new text
const original = getOriginal(result);
const newText = getNew(result);
```

## Polyglot Examples

```python
# Python
from elide_fast_diff import diff
result = diff("old", "new")
```

```ruby
# Ruby
require 'elide_fast_diff'
result = diff("old", "new")
```

```java
// Java
import elide.FastDiff;
var result = FastDiff.diff("old", "new");
```

Based on https://www.npmjs.com/package/fast-diff (~500K+ downloads/week)
