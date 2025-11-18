# zxcvbn - Elide Polyglot Showcase

> **Password strength estimation for ALL languages** - TypeScript, Python, Ruby, and Java

## Features

- Realistic password strength estimation
- Time-to-crack calculations
- Pattern matching (dates, names, etc.)
- Feedback and suggestions
- **~3M downloads/week on npm**

## Quick Start

```typescript
import zxcvbn from './elide-zxcvbn.ts';

const result = zxcvbn('mypassword');
console.log(`Score: ${result.score}/4`);
console.log(`Guesses: ${result.guesses}`);
console.log(`Feedback: ${result.feedback.suggestions}`);
```

## Links

- [Original npm package](https://www.npmjs.com/package/zxcvbn)

---

**Built with ❤️ for the Elide Polyglot Runtime**
