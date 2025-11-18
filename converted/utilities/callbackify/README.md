# Elide Callbackify

Pure TypeScript implementation of `callbackify`.

## Original Package

- **npm**: `callbackify`
- **Downloads**: ~5M/week

## Usage

```typescript
import callbackify from './elide-callbackify.ts';

const asyncFn = async (x: number) => x * 2;
const callbackFn = callbackify(asyncFn);

callbackFn(5, (err, result) => {
  console.log(result); // 10
});
```
