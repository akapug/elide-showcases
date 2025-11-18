# accessible-autocomplete - Elide Polyglot Showcase

> **Accessible autocomplete for ALL languages** - TypeScript, Python, Ruby, and Java

## Features

- ARIA compliant autocomplete
- Keyboard navigation
- Screen reader support
- Async source support
- **~50K+ downloads/week on npm**

## Quick Start

```typescript
import accessibleAutocomplete from './elide-accessible-autocomplete.ts';

const autocomplete = accessibleAutocomplete({
  element: '#autocomplete',
  source: (query, populateResults) => {
    populateResults(['Option 1', 'Option 2']);
  }
});
```

## Links

- [Original npm package](https://www.npmjs.com/package/accessible-autocomplete)

---

**Built with ❤️ for the Elide Polyglot Runtime**
