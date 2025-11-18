# sentry - Elide Polyglot Showcase

> **Error tracking and monitoring for ALL languages** - TypeScript, Python, Ruby, and Java

## Features

- Error tracking and reporting
- Performance monitoring
- Release tracking
- **~10M downloads/week on npm**

## Quick Start

```typescript
import sentry from './elide-sentry.ts';

sentry.init({
  dsn: 'https://your-dsn@sentry.io/project',
  environment: 'production',
  release: '1.0.0'
});

try {
  throw new Error('Something broke!');
} catch (error) {
  sentry.captureException(error);
}
```

## Links

- [Original npm package](https://www.npmjs.com/package/@sentry/node)

---

**Built with ❤️ for the Elide Polyglot Runtime**
