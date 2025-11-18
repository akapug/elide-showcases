# Elide Pify

Pure TypeScript implementation of `pify`.

## Original Package

- **npm**: `pify`
- **Downloads**: ~40M/week

## Usage

```typescript
import pify from './elide-pify.ts';
import fs from 'fs';

const readFile = pify(fs.readFile);
const content = await readFile('file.txt', 'utf8');
```
