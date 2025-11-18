# Listr - Task Lists

Terminal task lists with beautiful output in pure TypeScript.

## Features

- ✅ Task organization
- ✅ Concurrent tasks
- ✅ Task status tracking
- ✅ Subtasks support
- ✅ Zero dependencies

## Usage

```typescript
import Listr from './elide-listr.ts';

const tasks = new Listr([
  {
    title: 'Task 1',
    task: async () => { /* work */ }
  },
  {
    title: 'Task 2',
    task: async () => { /* work */ }
  }
]);

await tasks.run();
```

## NPM Stats

- 📦 ~8M+ downloads/week
- ✨ Zero dependencies
