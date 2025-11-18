# Elide Node-Dev

Development tool with auto-reload, notifications, and graceful shutdown.

## Features

- File watching with auto-reload
- Notification support for restarts
- Graceful shutdown handling
- TypeScript support built-in
- Source map support
- Module cache clearing
- Configurable poll intervals

## Usage

```typescript
import { run, NodeDev } from './elide-node-dev.ts';

// Simple usage
const dev = run({
  script: './server.ts',
  notify: true,
  clear: true
});

// Advanced configuration
const advanced = new NodeDev({
  script: './app.ts',
  gracefulShutdown: true,
  timestamp: true,
  deps: 1,
  poll: 500,
  ignore: ['dist', 'test'],
  nodeArgs: ['--inspect']
});

advanced.start();
```

## NPM Comparison

- **NPM Package**: node-dev
- **Weekly Downloads**: ~3,000,000
- **Bundle Size**: 300KB
- **Dependencies**: 20+
- **Elide Version**: Zero dependencies, pure TypeScript

## Elide Advantages

- Multi-language development hot reload
- GraalVM native debugging integration
- Instant JIT warmup after reload
- Lower resource consumption
