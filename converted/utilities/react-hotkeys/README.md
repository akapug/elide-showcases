# react-hotkeys - Elide Polyglot Showcase

> **React hotkeys for ALL languages** - TypeScript, Python, Ruby, and Java

## Features

- Declarative hotkey binding
- Focus trap integration
- Scope management
- **~200K+ downloads/week on npm**

## Quick Start

```typescript
import { useHotkeys } from './elide-react-hotkeys.ts';

const { keyMap, handlers } = useHotkeys(
  { SAVE: 'ctrl+s' },
  { SAVE: () => save() }
);
```

## Links

- [Original npm package](https://www.npmjs.com/package/react-hotkeys)

---

**Built with ❤️ for the Elide Polyglot Runtime**
