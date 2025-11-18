# i18next - Elide Polyglot Showcase

> **One i18n framework for ALL languages** - TypeScript, Python, Ruby, and Java

Complete internationalization solution with pluralization, formatting, and interpolation.

## Features

- Translation with interpolation
- Pluralization support
- Nested translations
- Language detection
- Namespace support
- Variable formatting
- Zero dependencies
- **~3M downloads/week on npm**

## Quick Start

```typescript
import i18next from './elide-i18next.ts';

i18next.init({
  lng: 'en',
  resources: {
    en: {
      translation: {
        greeting: 'Hello, {{name}}!'
      }
    },
    es: {
      translation: {
        greeting: '¡Hola, {{name}}!'
      }
    }
  }
});

console.log(i18next.t('greeting', { name: 'Alice' }));
// Output: Hello, Alice!

i18next.changeLanguage('es');
console.log(i18next.t('greeting', { name: 'Alice' }));
// Output: ¡Hola, Alice!
```

## Documentation

Run the demo:

```bash
elide run elide-i18next.ts
```

## Links

- [Original npm package](https://www.npmjs.com/package/i18next)
- [i18next Documentation](https://www.i18next.com/)

---

**Built with ❤️ for the Elide Polyglot Runtime**
