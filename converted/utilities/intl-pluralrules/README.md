# intl-pluralrules - Elide Polyglot Showcase
> Plural rules polyfill
## Features
- Plural form selection
- **~500K downloads/week on npm**
## Quick Start
```typescript
import PluralRules from './elide-intl-pluralrules.ts';
const pr = new PluralRules('en');
console.log(pr.select(1)); // "one"
console.log(pr.select(5)); // "other"
```
---
**Built with ❤️ for the Elide Polyglot Runtime**
