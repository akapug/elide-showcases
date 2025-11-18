# Elide P-Reflect

Pure TypeScript implementation of `p-reflect`.

## Original Package

- **npm**: `p-reflect`
- **Downloads**: ~8M/week

## Usage

```typescript
import pReflect from './elide-p-reflect.ts';

const result = await pReflect(fetchData());
if (result.isFulfilled) {
  console.log(result.value);
} else {
  console.log(result.reason);
}
```
