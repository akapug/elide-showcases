# Proxy-Memoize - Proxy-based Memoization

Automatic dependency tracking with Proxies.

Based on [proxy-memoize](https://www.npmjs.com/package/proxy-memoize) (~50K+ downloads/week)

## Quick Start

```typescript
import memoize from './elide-proxy-memoize.ts';

const compute = memoize((obj: any) => ({
  doubled: obj.value * 2
}));
```
