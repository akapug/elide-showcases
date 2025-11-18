# Yargs - CLI Parser

Modern command-line argument parser with interactive features in pure TypeScript.

## Features

- ✅ Argument parsing (options, positionals)
- ✅ Commands and subcommands
- ✅ Type coercion (number, boolean, array, string)
- ✅ Validation and constraints
- ✅ Auto-generated help
- ✅ Middleware support
- ✅ Aliases and defaults
- ✅ Zero dependencies

## Usage

```typescript
import yargs from './elide-yargs.ts';

const argv = yargs(process.argv.slice(2))
  .option('port', {
    alias: 'p',
    type: 'number',
    description: 'Port to bind on',
    default: 3000
  })
  .option('verbose', {
    alias: 'v',
    type: 'boolean',
    description: 'Run with verbose logging'
  })
  .argv;

console.log('Port:', argv.port);
console.log('Verbose:', argv.verbose);
```

## Polyglot Benefits

- 🌐 Works across JavaScript, Python, Ruby, Java on Elide
- 🔄 Share parsing logic across languages
- 🎯 Consistent CLI interface for all tools
- ⚡ One implementation, all languages

## NPM Stats

- 📦 ~70M+ downloads/week
- 🏆 Essential CLI parser
- ✨ Zero dependencies

Perfect for parsing CLI arguments in ANY language on Elide's polyglot runtime!
