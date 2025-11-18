# Elide Util.Promisify

Pure TypeScript implementation of `util.promisify`.

## Original Package

- **npm**: `util.promisify`
- **Downloads**: ~50M/week

## Usage

```typescript
import utilPromisify from './elide-util-promisify.ts';
import fs from 'fs';

const readFile = utilPromisify(fs.readFile);
const content = await readFile('file.txt', 'utf8');
```
