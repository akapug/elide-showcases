# @testing-library/react - Elide Polyglot Showcase

> **One React testing library for ALL languages** - TypeScript, Python, Ruby, and Java

Simple and complete React DOM testing utilities that encourage good testing practices.

## Features

- Render React components in tests
- Query DOM elements by role, text, label
- Simulate user interactions
- Async utilities for waiting
- Screen queries for convenience
- Zero dependencies
- **~5M downloads/week on npm**

## Quick Start

```typescript
import { render, screen, fireEvent } from './elide-testing-library-react.ts';

// Render a component
const result = render({
  type: 'button',
  props: { children: 'Click me' }
});

// Query by role
const button = result.getByRole('button');

// Query by text
const element = result.getByText('Click me');

// Fire events
fireEvent.click(button);

// Wait for async changes
await waitFor(() => {
  expect(screen.getByText('Success')).toBeTruthy();
});
```

## Documentation

Run the demo:

```bash
elide run elide-testing-library-react.ts
```

## Links

- [Original npm package](https://www.npmjs.com/package/@testing-library/react)
- [Testing Library Docs](https://testing-library.com/react)

---

**Built with ❤️ for the Elide Polyglot Runtime**
