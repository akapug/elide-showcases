# Commander for Elide

Complete solution for node.js command-line interfaces.

**Downloads**: ~22M/week on npm
**Category**: CLI Framework
**Status**: ✅ Production Ready

## Quick Start

```typescript
import { Command } from './commander.ts';

const program = new Command();

program
  .name('mycli')
  .description('CLI tool')
  .version('1.0.0')
  .option('-d, --debug', 'debug mode')
  .action((options) => {
    console.log('Options:', options);
  });

program.parse();
```

## Features

- Option parsing (short -d, long --debug)
- Commands and subcommands
- Automated help
- Version handling
- Command aliases
- Required options

## Resources

- Original: https://www.npmjs.com/package/commander
- Downloads: ~22M/week
