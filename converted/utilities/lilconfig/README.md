# Lilconfig - Configuration File Finder

Zero-dependency configuration file finder and loader.

Based on [lilconfig](https://www.npmjs.com/package/lilconfig) (~3M+ downloads/week)

## Features

- Search for config files
- Multiple file formats (JSON, JS, YAML)
- Custom loaders
- Async support
- Package.json support
- Zero dependencies

## Quick Start

```typescript
import { lilconfig } from './elide-lilconfig.ts';

const explorer = lilconfig('myapp');

// Search for config
const result = await explorer.search();
if (result) {
  console.log(result.config);
  console.log(result.filepath);
}

// Load specific file
const config = await explorer.load('.myapprc');
```

## Polyglot Examples

**JavaScript/TypeScript:**
```typescript
const explorer = lilconfig('myapp');
const result = await explorer.search();
```

**Python (via Elide):**
```python
explorer = lilconfig('myapp')
result = await explorer.search()
```

**Ruby (via Elide):**
```ruby
explorer = lilconfig('myapp')
result = explorer.search
```

## Why Polyglot?

- Same config loading across all languages
- Support multiple config formats
- Share configuration conventions
- Universal config file resolution
