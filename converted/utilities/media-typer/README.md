# Media Typer

Media Typer for Elide (polyglot!)

Based on https://www.npmjs.com/package/media-typer (~10M+ downloads/week)

## Features

- Type parsing
- Format validation
- Object API
- Serialization
- Zero dependencies

## Quick Start

```typescript
import media-typer from './elide-media-typer.ts';

// Basic usage
const result = media-typer.main();
console.log(result);
```

## Polyglot Examples

### JavaScript/TypeScript
```typescript
import media-typer from './elide-media-typer.ts';
const result = media-typer.main();
```

### Python (via Elide)
```python
from elide_media-typer import media-typer
result = media-typer.main()
```

### Ruby (via Elide)
```ruby
require 'elide/media-typer'
result = media-typer.main
```

### Java (via Elide)
```java
import elide.media-typer.*;
String result = Media_Typer.main();
```

## Benefits

- One library for ALL languages on Elide
- Consistent API across languages
- ~10M+ downloads/week on npm!
