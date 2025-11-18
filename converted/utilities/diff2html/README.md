# Diff2HTML - Unified Diff to HTML Converter

Convert unified diff output to pretty HTML on Elide.

## Features

- Parse unified diff format
- Generate pretty HTML
- Side-by-side and line-by-line views
- Default CSS included
- Zero dependencies

## Quick Start

```typescript
import { parse, html, defaultCSS } from './elide-diff2html.ts';

// Parse diff
const diffText = `--- a/file.txt\n+++ b/file.txt\n@@ -1 +1 @@\n-old\n+new`;
const files = parse(diffText);

// Generate HTML
const htmlOutput = html(files);

// Side-by-side view
const sideBySide = html(files, { sideBySide: true });

// Get CSS
const css = defaultCSS();
```

## Polyglot Examples

```python
# Python
from elide_diff2html import parse, html
files = parse(diff_text)
output = html(files)
```

```ruby
# Ruby
require 'elide_diff2html'
files = parse(diff_text)
output = html(files)
```

```java
// Java
import elide.Diff2HTML;
var files = Diff2HTML.parse(diffText);
var html = Diff2HTML.html(files);
```

Based on https://www.npmjs.com/package/diff2html (~100K+ downloads/week)
