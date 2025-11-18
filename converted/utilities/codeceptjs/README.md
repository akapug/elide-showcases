# codeceptjs - Elide Polyglot Showcase

> **One E2E framework for ALL languages** - TypeScript, Python, Ruby, and Java

Supercharged end-to-end testing framework.

## Features

- Scenario-driven approach
- Multiple helper support
- Page objects
- Data-driven tests
- Parallel execution
- Zero dependencies
- **~100K downloads/week on npm**

## Quick Start

```typescript
import { Feature, Scenario, I } from './elide-codeceptjs.ts';

Feature('Login');

Scenario('User can login', (I) => {
  I.amOnPage('/login');
  I.fillField('username', 'alice');
  I.click('Submit');
  I.see('Welcome');
});
```

## Links

- [Original npm package](https://www.npmjs.com/package/codeceptjs)

---

**Built with ❤️ for the Elide Polyglot Runtime**
