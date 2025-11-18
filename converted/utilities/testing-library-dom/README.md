# @testing-library/dom - Elide Polyglot Showcase

> **One DOM testing library for ALL languages** - TypeScript, Python, Ruby, and Java

Simple and complete DOM testing utilities that encourage good testing practices.

## Features

- Query DOM elements by role, text, label
- Accessible queries (ARIA roles)
- Async utilities (waitFor, waitForElementToBeRemoved)
- Fire DOM events
- Pretty DOM printing
- Zero dependencies
- **~5M downloads/week on npm**

## Quick Start

```typescript
import { getByRole, getByText, fireEvent, waitFor } from './elide-testing-library-dom.ts';

// Query by role
const button = getByRole(container, 'button', { name: 'Submit' });

// Query by text
const element = getByText(container, 'Hello World');

// Fire events
fireEvent.click(button);

// Wait for async changes
await waitFor(() => {
  expect(getByText(container, 'Success')).toBeTruthy();
});
```

## Documentation

Run the demo:

```bash
elide run elide-testing-library-dom.ts
```

## Links

- [Original npm package](https://www.npmjs.com/package/@testing-library/dom)
- [Testing Library Docs](https://testing-library.com/docs/dom-testing-library/intro)

---

**Built with ❤️ for the Elide Polyglot Runtime**
