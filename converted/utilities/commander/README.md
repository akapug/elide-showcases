# Commander - CLI Framework

Complete solution for building command-line interfaces in pure TypeScript.

## Features

- ✅ Command definition and parsing
- ✅ Options with short/long flags
- ✅ Subcommands support
- ✅ Variadic arguments
- ✅ Action handlers
- ✅ Auto-generated help
- ✅ Type-safe TypeScript API
- ✅ Zero dependencies

## Usage

```typescript
import { Command } from './elide-commander.ts';

const program = new Command()
  .name('mycli')
  .description('My awesome CLI tool')
  .version('1.0.0')
  .option('-d, --debug', 'enable debug mode')
  .option('-c, --config <path>', 'config file path')
  .action((options) => {
    console.log('Running with options:', options);
  });

program.parse(process.argv);
```

## Polyglot Benefits

- 🌐 Works across JavaScript, Python, Ruby, Java on Elide
- 🔄 Share CLI patterns across languages
- 🎯 Consistent UX across your tool stack
- ⚡ One implementation, all languages

## NPM Stats

- 📦 ~80M+ downloads/week
- 🏆 THE standard CLI framework
- ✨ Zero dependencies

Perfect for building CLI tools in ANY language on Elide's polyglot runtime!
