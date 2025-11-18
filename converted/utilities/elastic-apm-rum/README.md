# @elastic/apm-rum - Elide Polyglot Showcase

> **Real User Monitoring for ALL languages** - TypeScript, Python, Ruby, and Java

## Features

- Real user monitoring
- Page load metrics
- Transaction tracking
- Error tracking
- **~50K downloads/week on npm**

## Quick Start

```typescript
import apm from './elide-elastic-apm-rum.ts';

apm.init({
  serviceName: 'my-web-app',
  serverUrl: 'http://localhost:8200',
  environment: 'production',
});

const transaction = apm.startTransaction('Page Load', 'page-load');
apm.endTransaction();
```

## Links

- [Original npm package](https://www.npmjs.com/package/@elastic/apm-rum)

---

**Built with ❤️ for the Elide Polyglot Runtime**
