# joi-password-complexity - Elide Polyglot Showcase

> **One password validator for ALL languages** - TypeScript, Python, Ruby, and Java

Password complexity validation for Joi.

## Features

- Password complexity rules
- Customizable requirements
- **~300K downloads/week on npm**

```typescript
import passwordComplexity from './elide-joi-password-complexity.ts';

const validator = passwordComplexity({ min: 8 });
validator.validate("Abc123!@#");
```

---

**Built with ❤️ for the Elide Polyglot Runtime**
