# @bugsnag/js - Elide Polyglot Showcase

> **Error monitoring for ALL languages** - TypeScript, Python, Ruby, and Java

## Features

- Automatic error detection
- Breadcrumbs for debugging
- User tracking
- Custom metadata
- **~100K downloads/week on npm**

## Quick Start

```typescript
import bugsnag from './elide-bugsnag-js.ts';

bugsnag.start({
  apiKey: 'your-api-key',
  appVersion: '1.0.0',
});

bugsnag.notify(new Error('Something broke'));
bugsnag.leaveBreadcrumb('User action', { action: 'click' });
```

## Links

- [Original npm package](https://www.npmjs.com/package/@bugsnag/js)

---

**Built with ❤️ for the Elide Polyglot Runtime**
