# rollbar - Elide Polyglot Showcase

> **Error tracking service for ALL languages** - TypeScript, Python, Ruby, and Java

## Features

- Real-time error tracking
- Deploy tracking
- Custom data logging
- **~2M downloads/week on npm**

## Quick Start

```typescript
import Rollbar from './elide-rollbar.ts';

const rollbar = new Rollbar({
  accessToken: 'your-access-token',
  environment: 'production',
  codeVersion: '1.0.0'
});

rollbar.error(new Error('Something went wrong'));
rollbar.info('User logged in');
rollbar.warning('API rate limit approaching');
```

## Links

- [Original npm package](https://www.npmjs.com/package/rollbar)

---

**Built with ❤️ for the Elide Polyglot Runtime**
