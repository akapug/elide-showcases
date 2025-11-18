# Node Diff3 - Three-Way Merge Algorithm

Perform 3-way merge of text files on Elide.

## Features

- 3-way merge algorithm
- Conflict detection
- Common ancestor support
- Used in version control
- Zero dependencies

## Quick Start

```typescript
import merge3, { mergeStrings } from './elide-node-diff3.ts';

// Merge arrays
const original = ["line 1", "line 2"];
const versionA = ["line 1", "line 2 changed"];
const versionB = ["line 1", "line 2", "line 3"];
const result = merge3(versionA, original, versionB);
console.log(result.result);
console.log("Has conflicts:", result.conflict);

// Merge strings
const merged = mergeStrings(strA, original, strB);
```

## Polyglot Examples

```python
# Python
from elide_node_diff3 import merge3
result = merge3(version_a, original, version_b)
```

```ruby
# Ruby
require 'elide_node_diff3'
result = merge3(version_a, original, version_b)
```

```java
// Java
import elide.NodeDiff3;
var result = NodeDiff3.merge3(versionA, original, versionB);
```

Based on https://www.npmjs.com/package/node-diff3 (~50K+ downloads/week)
