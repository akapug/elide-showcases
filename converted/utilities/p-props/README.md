# Elide P-Props

Pure TypeScript implementation of `p-props`.

## Original Package

- **npm**: `p-props`
- **Downloads**: ~8M/week

## Usage

```typescript
import pProps from './elide-p-props.ts';

const result = await pProps({
  users: fetchUsers(),
  posts: fetchPosts(),
  settings: Promise.resolve({ theme: 'dark' }),
});
```
