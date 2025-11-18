# Pluggable - Simple Plugin System

Minimalist plugin system for JavaScript applications.

Based on [pluggable](https://www.npmjs.com/package/pluggable) (~30K+ downloads/week)

## Features

- Plugin registration
- Plugin loading
- Hook system
- Event emission

## Quick Start

```typescript
import Pluggable from './elide-pluggable.ts';

const system = new Pluggable();
system.use({
  name: 'myPlugin',
  install: (app) => {
    console.log('Plugin installed!');
  }
});

await system.install(app);
```
