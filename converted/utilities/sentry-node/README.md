# @sentry/node - Elide Polyglot Showcase

> **Error tracking for ALL languages** - TypeScript, Python, Ruby, and Java

## Features

- Automatic error capture
- Performance monitoring
- Breadcrumbs for debugging
- Custom tags and context
- **~1M downloads/week on npm**

## Quick Start

```typescript
import Sentry from './elide-sentry-node.ts';

Sentry.init({
  dsn: 'https://key@sentry.io/project',
  environment: 'production',
  release: 'my-app@1.0.0',
});

Sentry.captureException(new Error('Something broke'));
Sentry.captureMessage('User logged in', 'info');
```

## Links

- [Original npm package](https://www.npmjs.com/package/@sentry/node)

---

**Built with ❤️ for the Elide Polyglot Runtime**
