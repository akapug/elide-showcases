# airbrake - Elide Polyglot Showcase

> **Error monitoring for ALL languages** - TypeScript, Python, Ruby, and Java

## Features

- Exception tracking
- Error grouping
- Performance monitoring
- Custom parameters
- **~30K downloads/week on npm**

## Quick Start

```typescript
import { Notifier } from './elide-airbrake.ts';

const airbrake = new Notifier({
  projectId: 12345,
  projectKey: 'your-project-key',
  environment: 'production',
});

airbrake.notify(new Error('Something broke'));
```

## Links

- [Original npm package](https://www.npmjs.com/package/airbrake)

---

**Built with ❤️ for the Elide Polyglot Runtime**
