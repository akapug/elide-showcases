# i18next-browser-languagedetector - Elide Polyglot Showcase

> **One language detector for ALL languages** - TypeScript, Python, Ruby, and Java

Automatically detect user language from browser settings.

## Features

- Browser language detection
- localStorage persistence
- Cookie support
- Query string detection
- Navigator API
- Custom detectors
- Zero dependencies
- **~1M downloads/week on npm**

## Quick Start

```typescript
import LanguageDetector from './elide-i18next-browser-languagedetector.ts';

const detector = new LanguageDetector({
  order: ['querystring', 'cookie', 'localStorage', 'navigator'],
  lookupQuerystring: 'lng',
  caches: ['localStorage', 'cookie']
});

const language = detector.detect();
console.log('Detected language:', language);

// Cache user preference
detector.cacheUserLanguage('es-ES');
```

## Documentation

Run the demo:

```bash
elide run elide-i18next-browser-languagedetector.ts
```

## Links

- [Original npm package](https://www.npmjs.com/package/i18next-browser-languagedetector)

---

**Built with ❤️ for the Elide Polyglot Runtime**
