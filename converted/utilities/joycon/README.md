# Joycon - Config File Loader

Load config files with ease.

Based on [joycon](https://www.npmjs.com/package/joycon) (~100K+ downloads/week)

## Features

- Load config files
- Multiple formats (JSON, JS, YAML)
- Search parent directories
- Custom loaders

## Quick Start

```typescript
import JoyCon from './elide-joycon.ts';

const joycon = new JoyCon();
const result = await joycon.load(['.myrc', 'package.json']);
console.log(result.data);
```
