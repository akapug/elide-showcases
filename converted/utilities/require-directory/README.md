# Require-Directory - Recursively Require Modules

Recursively require all files in a directory.

Based on [require-directory](https://www.npmjs.com/package/require-directory) (~500K+ downloads/week)

## Features

- Recursive module loading
- Pattern filtering
- Custom visitors
- Ignore patterns
- File extension filtering
- Zero dependencies

## Quick Start

```typescript
import requireDirectory from './elide-require-directory.ts';

// Load all modules in directory
const modules = requireDirectory('./controllers');

// With options
const routes = requireDirectory('./routes', {
  recurse: true,
  extensions: ['.js', '.ts'],
  visit: (obj, filepath) => {
    console.log('Loading:', filepath);
    return obj;
  }
});
```

## Polyglot Examples

**JavaScript/TypeScript:**
```typescript
const controllers = requireDirectory('./controllers');
```

**Python (via Elide):**
```python
controllers = require_directory('./controllers')
```

**Ruby (via Elide):**
```ruby
controllers = require_directory('./controllers')
```

## Why Polyglot?

- Auto-load modules across all languages
- Recursive directory scanning
- Share file organization
- Consistent module discovery
