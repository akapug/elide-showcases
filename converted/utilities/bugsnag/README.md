# bugsnag - Elide Polyglot Showcase

> **Error monitoring and reporting for ALL languages** - TypeScript, Python, Ruby, and Java

## Features

- Automatic error detection
- Release stage tracking
- User tracking
- **~2M downloads/week on npm**

## Quick Start

```typescript
import bugsnag from './elide-bugsnag.ts';

bugsnag.start({
  apiKey: 'your-api-key',
  releaseStage: 'production',
  appVersion: '1.0.0'
});

bugsnag.setUser('123', 'user@example.com');

try {
  throw new Error('Oops!');
} catch (error) {
  bugsnag.notify(error);
}
```

## Links

- [Original npm package](https://www.npmjs.com/package/@bugsnag/js)

---

**Built with ❤️ for the Elide Polyglot Runtime**
