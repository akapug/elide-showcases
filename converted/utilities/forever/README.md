# Elide Forever

Continuous process runner that keeps your applications running forever.

## Features

- Keep processes running continuously
- Auto-restart on crashes
- Configurable restart limits
- Min uptime enforcement
- Process monitoring and logging

## Usage

```typescript
import { forever } from './elide-forever.ts';

const monitor = forever.start('./server.ts', {
  max: 10,
  minUptime: 5000,
  logFile: './forever.log'
});
```

## NPM Comparison

- **NPM Package**: forever
- **Weekly Downloads**: ~5,000,000
- **Elide Version**: Zero dependencies, pure TypeScript
