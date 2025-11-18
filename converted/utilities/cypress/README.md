# cypress - Elide Polyglot Showcase

> **One E2E testing framework for ALL languages** - TypeScript, Python, Ruby, and Java

Fast, easy and reliable testing for anything that runs in a browser.

## Features

- Time travel debugging
- Automatic waiting
- Network stubbing
- Screenshots & videos
- Real browser testing
- Zero dependencies
- **~2M downloads/week on npm**

## Quick Start

```typescript
import { cy, describe, it } from './elide-cypress.ts';

describe('Login', () => {
  it('should login', () => {
    cy.visit('/login');
    cy.get('input').type('alice');
    cy.contains('Submit').click();
  });
});
```

## Links

- [Original npm package](https://www.npmjs.com/package/cypress)

---

**Built with ❤️ for the Elide Polyglot Runtime**
