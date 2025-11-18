# @testing-library/jest-dom - Elide Polyglot Showcase

> **One DOM assertion library for ALL languages** - TypeScript, Python, Ruby, and Java

Custom Jest matchers to test the state of the DOM.

## Features

- toBeInTheDocument() - element is in DOM
- toBeVisible() - element is visible
- toHaveTextContent() - text content matching
- toHaveAttribute() - attribute checking
- toBeDisabled() / toBeEnabled() - form state
- Zero dependencies
- **~4M downloads/week on npm**

## Quick Start

```typescript
import { toBeInTheDocument, toHaveTextContent } from './elide-testing-library-jest-dom.ts';

expect(toBeInTheDocument(element)).toBeTruthy();
expect(toHaveTextContent(element, 'Hello')).toBeTruthy();
```

## Documentation

Run the demo:

```bash
elide run elide-testing-library-jest-dom.ts
```

## Links

- [Original npm package](https://www.npmjs.com/package/@testing-library/jest-dom)

---

**Built with ❤️ for the Elide Polyglot Runtime**
