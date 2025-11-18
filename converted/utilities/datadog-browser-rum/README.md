# @datadog/browser-rum - Elide Polyglot Showcase

> **Real User Monitoring for ALL languages** - TypeScript, Python, Ruby, and Java

## Features

- Real user monitoring in browser
- Performance metrics collection
- User session tracking
- Error tracking and reporting
- **~50K downloads/week on npm**

## Quick Start

```typescript
import { datadogRum } from './elide-datadog-browser-rum.ts';

datadogRum.init({
  applicationId: 'app-123',
  clientToken: 'token-abc',
  service: 'my-web-app',
  env: 'production',
});

datadogRum.addAction('button_click', { button_id: 'submit' });
datadogRum.addError(new Error('Failed'), { context: 'payment' });
```

## Links

- [Original npm package](https://www.npmjs.com/package/@datadog/browser-rum)

---

**Built with ❤️ for the Elide Polyglot Runtime**
