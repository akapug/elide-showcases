# Elide P-Forever

Pure TypeScript implementation of `p-forever`.

## Original Package

- **npm**: `p-forever`
- **Downloads**: ~1M/week

## Usage

```typescript
import pForever from './elide-p-forever.ts';

await pForever(async () => {
  await pollForUpdates();
  await delay(1000);
});
```
