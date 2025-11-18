# vue-i18n - Elide Polyglot Showcase

> **One Vue i18n solution for ALL languages** - TypeScript, Python, Ruby, and Java

Internationalization plugin for Vue.js applications.

## Features

- Component-based localization
- Reactive language switching
- Pluralization support
- DateTime localization
- Number localization
- Fallback localization
- Zero dependencies
- **~1M downloads/week on npm**

## Quick Start

```typescript
import VueI18n from './elide-vue-i18n.ts';

const i18n = new VueI18n({
  locale: 'en',
  fallbackLocale: 'en',
  messages: {
    en: {
      greeting: 'Hello',
      welcome: 'Welcome, {name}!'
    },
    es: {
      greeting: 'Hola',
      welcome: '¡Bienvenido, {name}!'
    }
  }
});

console.log(i18n.t('greeting'));
console.log(i18n.t('welcome', { name: 'Alice' }));

i18n.setLocale('es');
console.log(i18n.t('greeting'));
```

## Documentation

Run the demo:

```bash
elide run elide-vue-i18n.ts
```

## Links

- [Original npm package](https://www.npmjs.com/package/vue-i18n)
- [Vue I18n Documentation](https://vue-i18n.intlify.dev/)

---

**Built with ❤️ for the Elide Polyglot Runtime**
