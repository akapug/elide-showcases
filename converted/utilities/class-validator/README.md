# Class Validator - Elide Polyglot Showcase

> **One decorator validator for ALL languages** - TypeScript, Python, Ruby, and Java

Decorator-based validation for TypeScript classes.

## Features

- Decorator-based validation
- Class transformation
- Custom validators
- **~10M downloads/week on npm**

## Quick Start

```typescript
import { IsString, IsEmail, validate } from './elide-class-validator.ts';

class User {
  @IsString()
  name: string;

  @IsEmail()
  email: string;
}
```

---

**Built with ❤️ for the Elide Polyglot Runtime**
