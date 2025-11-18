# Diff Sequences - Sequence Comparison Algorithm

Compare items in two sequences to find a longest common subsequence on Elide.

## Features

- Longest common subsequence (LCS)
- Optimized diff algorithm
- Works with any comparable items
- Used by Jest for test diffs
- Zero dependencies

## Quick Start

```typescript
import diffSequences, { diffArrays } from './elide-diff-sequences.ts';

// Diff arrays
const diff = diffArrays([1, 2, 3], [1, 3, 4]);
console.log(diff);

// Custom comparison
diffSequences(
  arr1.length,
  arr2.length,
  (i, j) => arr1[i] === arr2[j],
  {
    foundSubsequence: (n, aIdx, bIdx) => {
      console.log(`Common: ${n} items at ${aIdx}`);
    }
  }
);
```

## Polyglot Examples

```python
# Python
from elide_diff_sequences import diff_arrays
diff = diff_arrays([1, 2, 3], [1, 3, 4])
```

```ruby
# Ruby
require 'elide_diff_sequences'
diff = diff_arrays([1, 2, 3], [1, 3, 4])
```

```java
// Java
import elide.DiffSequences;
var diff = DiffSequences.diffArrays(arr1, arr2);
```

Based on https://www.npmjs.com/package/diff-sequences (~10M+ downloads/week)
