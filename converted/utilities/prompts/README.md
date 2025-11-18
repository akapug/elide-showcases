# Prompts - Lightweight CLI Prompts

Lightweight, beautiful CLI prompts with minimal dependencies in pure TypeScript.

## Features

- ✅ Text input
- ✅ Number input
- ✅ Confirm prompts
- ✅ Select lists
- ✅ Multi-select
- ✅ Toggle switches
- ✅ Validation
- ✅ Zero dependencies

## Usage

```typescript
import prompts from './elide-prompts.ts';

const response = await prompts([
  {
    type: 'text',
    name: 'username',
    message: 'What is your username?'
  },
  {
    type: 'number',
    name: 'age',
    message: 'How old are you?',
    initial: 25
  },
  {
    type: 'confirm',
    name: 'subscribe',
    message: 'Subscribe to newsletter?',
    initial: true
  }
]);

console.log(response);
```

## Polyglot Benefits

- 🌐 Works across all Elide languages
- 🔄 Minimal footprint
- 🎯 Consistent prompt UX
- ⚡ Lightweight and fast

## NPM Stats

- 📦 ~15M+ downloads/week
- 🏆 Lightweight prompt library
- ✨ Zero dependencies

Perfect for lightweight CLI prompts in ANY language on Elide!
