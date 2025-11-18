# i18next-http-backend - Elide Polyglot Showcase

> **One HTTP backend for ALL languages** - TypeScript, Python, Ruby, and Java

Load translation files from HTTP server.

## Features

- Load translations via HTTP
- Lazy loading support
- Caching mechanism
- Custom request options
- Retry logic
- Path customization
- Zero dependencies
- **~800K downloads/week on npm**

## Quick Start

```typescript
import HttpBackend from './elide-i18next-http-backend.ts';

const backend = new HttpBackend({
  loadPath: '/locales/{{lng}}/{{ns}}.json',
  customHeaders: {
    'Authorization': 'Bearer token123'
  },
  queryStringParams: {
    version: '1.0'
  }
});

// Load translation
const translations = await backend.read('en', 'translation');
console.log(translations);

// Clear cache
backend.clearCache('en', 'translation');
```

## Documentation

Run the demo:

```bash
elide run elide-i18next-http-backend.ts
```

## Links

- [Original npm package](https://www.npmjs.com/package/i18next-http-backend)

---

**Built with ❤️ for the Elide Polyglot Runtime**
