# @testing-library/user-event - Elide Polyglot Showcase

> **One user event library for ALL languages** - TypeScript, Python, Ruby, and Java

Fire events the same way the user does for more realistic testing.

## Features

- Type into inputs realistically
- Click elements with proper event order
- Keyboard navigation and shortcuts
- Upload files
- Copy/paste operations
- Zero dependencies
- **~4M downloads/week on npm**

## Quick Start

```typescript
import userEvent from './elide-testing-library-user-event.ts';

// Type text
await userEvent.type(input, 'Hello World');

// Click
await userEvent.click(button);

// Clear input
await userEvent.clear(input);

// Tab navigation
await userEvent.tab();

// Hover
await userEvent.hover(element);
```

## Documentation

Run the demo:

```bash
elide run elide-testing-library-user-event.ts
```

## Links

- [Original npm package](https://www.npmjs.com/package/@testing-library/user-event)
- [Testing Library Docs](https://testing-library.com/docs/user-event/intro)

---

**Built with ❤️ for the Elide Polyglot Runtime**
