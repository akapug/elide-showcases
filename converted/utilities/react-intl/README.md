# react-intl - Elide Polyglot Showcase

> **One React intl solution for ALL languages** - TypeScript, Python, Ruby, and Java

React components for internationalization with ICU MessageFormat.

## Features

- FormattedMessage component
- FormattedDate component
- FormattedNumber component
- FormattedTime component
- ICU MessageFormat
- Pluralization
- Zero dependencies
- **~1M downloads/week on npm**

## Quick Start

```typescript
import { IntlProvider, FormattedMessage, FormattedDate } from './elide-react-intl.ts';

const intl = new IntlProvider({
  locale: 'en-US',
  messages: {
    'greeting': 'Hello, {name}!'
  }
});

// Format message
const msg = intl.formatMessage({ id: 'greeting', values: { name: 'Alice' } });

// Format date
const date = intl.formatDate(new Date(), { month: 'long', day: 'numeric' });

// Format number as currency
const price = intl.formatNumber(99.99, { style: 'currency', currency: 'USD' });
```

## Documentation

Run the demo:

```bash
elide run elide-react-intl.ts
```

## Links

- [Original npm package](https://www.npmjs.com/package/react-intl)
- [FormatJS Documentation](https://formatjs.io/)

---

**Built with ❤️ for the Elide Polyglot Runtime**
