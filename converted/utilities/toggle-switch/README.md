# Toggle Switch - UI Toggles - Elide Polyglot Showcase

> **Toggle switches for ALL languages** - TypeScript, Python, Ruby, and Java

## 🚀 Quick Start

```typescript
import { createSwitch } from './elide-toggle-switch.ts';

const toggle = createSwitch({
  defaultState: false,
  onChange: (state) => console.log('Changed:', state)
});

toggle.toggle();
if (toggle.isOn()) {
  // Handle on state
}
```

**npm**: ~3K+ downloads/week

---

**Built with ❤️ for the Elide Polyglot Runtime**
