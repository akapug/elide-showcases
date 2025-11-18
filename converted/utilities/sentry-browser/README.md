# @sentry/browser - Elide Polyglot Showcase

> **Browser error tracking for ALL languages** - TypeScript, Python, Ruby, and Java

## Features

- Automatic browser error capture
- Global error handlers
- Performance monitoring
- User session tracking
- **~1M downloads/week on npm**

## Quick Start

```typescript
import Sentry from './elide-sentry-browser.ts';

Sentry.init({
  dsn: 'https://key@sentry.io/project',
  environment: 'production',
});

Sentry.captureException(new Error('Frontend error'));
```

## Links

- [Original npm package](https://www.npmjs.com/package/@sentry/browser)

---

**Built with ❤️ for the Elide Polyglot Runtime**
