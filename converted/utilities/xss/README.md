# xss - Elide Polyglot Showcase

> **XSS filter for ALL languages** - TypeScript, Python, Ruby, and Java

## Features

- Whitelist-based XSS filter
- Custom filter rules
- CSS filter to prevent style-based attacks
- Automatic encoding of special characters
- **~5M downloads/week on npm**

## Quick Start

```typescript
import xss from './elide-xss.ts';

// Basic filtering
const clean = xss('<script>alert("XSS")</script><p>Safe</p>');
// Result: '<p>Safe</p>'

// Custom whitelist
import { FilterXSS } from './elide-xss.ts';

const filter = new FilterXSS({
  whiteList: {
    a: ['href', 'title'],
    p: ['class']
  }
});

const safe = filter.process(userInput);
```

## Security Features

- Removes script and style tags with content
- Strips all event handlers
- Blocks dangerous protocols
- Whitelist-based tag filtering
- Attribute filtering

## Links

- [Original npm package](https://www.npmjs.com/package/xss)

---

**Built with ❤️ for the Elide Polyglot Runtime**
