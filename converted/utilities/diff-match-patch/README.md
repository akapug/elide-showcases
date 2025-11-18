# Diff Match Patch - Text Diffing, Matching, and Patching

Diff, match, and patch algorithms for plain text on Elide.

## Features

- Diff algorithm for comparing texts
- Match algorithm for locating patterns
- Patch algorithm for applying changes
- Semantic cleanup for readable diffs
- Merge from common ancestor
- Zero dependencies

## Quick Start

```typescript
import { diff, match, patchMake, patchApply, diffPrettyHtml } from './elide-diff-match-patch.ts';

// Create diff
const diffs = diff("Hello World", "Hello Elide");
console.log(diffs);

// Match pattern
const index = match("The quick brown fox", "brown");
console.log(index); // 10

// Create and apply patch
const patches = patchMake("Hello World", "Hello Elide");
const [result, success] = patchApply(patches, "Hello World");
console.log(result); // "Hello Elide"

// HTML output
const html = diffPrettyHtml(diffs);
```

## Polyglot Examples

Use the same diff library across all languages:

```python
# Python
from elide_diff_match_patch import diff
diffs = diff("old text", "new text")
```

```ruby
# Ruby
require 'elide_diff_match_patch'
diffs = diff("old text", "new text")
```

```java
// Java
import elide.DiffMatchPatch;
var diffs = DiffMatchPatch.diff("old text", "new text");
```

Based on https://www.npmjs.com/package/diff-match-patch (~200K+ downloads/week)
