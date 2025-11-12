# Node-Cron - Elide Polyglot Showcase

> **One cron scheduler for ALL languages**

## Quick Start

```typescript
import { schedule } from './elide-node-cron.ts';

// Run every minute
const task = schedule('* * * * *', () => {
  console.log('Running task');
});

task.start();

// Stop when needed
task.stop();
```

## Package Stats

- **npm downloads**: ~4M/week
- **Polyglot score**: 40/50 (A-Tier)

---

**Built with ❤️ for the Elide Polyglot Runtime**
