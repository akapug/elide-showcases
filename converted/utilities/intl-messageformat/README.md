# intl-messageformat - Elide Polyglot Showcase
> ICU MessageFormat implementation
## Features
- ICU message formatting
- Variable interpolation
- **~1M downloads/week on npm**
## Quick Start
```typescript
import IntlMessageFormat from './elide-intl-messageformat.ts';
const msg = new IntlMessageFormat("Hello, {name}!", "en");
console.log(msg.format({ name: "Alice" }));
```
---
**Built with ❤️ for the Elide Polyglot Runtime**
