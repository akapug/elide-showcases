# raygun - Elide Polyglot Showcase

> **Error and performance monitoring for ALL languages** - TypeScript, Python, Ruby, and Java

## Features

- Error tracking
- Real user monitoring
- Crash reporting
- Custom data and tags
- **~20K downloads/week on npm**

## Quick Start

```typescript
import raygun from './elide-raygun.ts';

raygun.init({
  apiKey: 'your-api-key',
  version: '1.0.0',
});

raygun.send(new Error('Something broke'));
raygun.recordBreadcrumb('User action');
```

## Links

- [Original npm package](https://www.npmjs.com/package/raygun)

---

**Built with ❤️ for the Elide Polyglot Runtime**
