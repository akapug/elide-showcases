# app-paths - Application Configuration Paths

Get application-specific paths for config, data, logs, cache.

Based on [app-paths](https://www.npmjs.com/package/app-paths) (~50K+ downloads/week)

## Quick Start

```typescript
import appPaths from './elide-app-paths.ts';

const paths = appPaths('my-app');
console.log(paths.config);  // Platform-specific config dir
console.log(paths.data);    // Platform-specific data dir
console.log(paths.cache);   // Platform-specific cache dir
```

## POLYGLOT Benefits
Works in JavaScript, Python, Ruby, Java via Elide!

~50K+ downloads/week on npm
