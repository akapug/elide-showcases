# Inquirer - Interactive CLI Prompts

Beautiful interactive command-line prompts in pure TypeScript.

## Features

- ✅ Input prompts
- ✅ Confirm (yes/no)
- ✅ List selection
- ✅ Checkbox (multiple choice)
- ✅ Password input
- ✅ Validation support
- ✅ Conditional questions
- ✅ Zero dependencies

## Usage

```typescript
import inquirer from './elide-inquirer.ts';

const answers = await inquirer.prompt([
  {
    type: 'input',
    name: 'username',
    message: 'What is your username?'
  },
  {
    type: 'list',
    name: 'framework',
    message: 'Choose a framework:',
    choices: ['React', 'Vue', 'Angular']
  },
  {
    type: 'confirm',
    name: 'proceed',
    message: 'Continue with installation?',
    default: true
  }
]);

console.log(answers);
```

## Polyglot Benefits

- 🌐 Works across JavaScript, Python, Ruby, Java on Elide
- 🔄 Share UX patterns across languages
- 🎯 Consistent user experience
- ⚡ One implementation, all languages

## NPM Stats

- 📦 ~25M+ downloads/week
- 🏆 Standard for interactive prompts
- ✨ Zero dependencies

Perfect for building interactive CLI tools in ANY language on Elide!
