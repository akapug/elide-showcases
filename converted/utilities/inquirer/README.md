# Inquirer for Elide

Interactive command-line prompts.

**Downloads**: ~8M/week on npm

## Quick Start

```typescript
import inquirer from './inquirer.ts';

const answers = await inquirer.prompt([
  { type: 'input', name: 'name', message: 'Your name?' },
  { type: 'confirm', name: 'ok', message: 'Continue?' }
]);
```

## Resources

- Original: https://www.npmjs.com/package/inquirer
