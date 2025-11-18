# polyglot - Elide Polyglot Showcase

> **One i18n library for ALL languages** - TypeScript, Python, Ruby, and Java

Simple internationalization library with pluralization support from Airbnb.

## Features

- Simple phrase translation
- Interpolation
- Pluralization rules
- Nested keys
- Locale switching
- Lightweight API
- Zero dependencies
- **~100K downloads/week on npm**

## Quick Start

```typescript
import Polyglot from './elide-polyglot.ts';

const polyglot = new Polyglot({
  locale: 'en',
  phrases: {
    'hello': 'Hello, %{name}',
    'cars': '%{smart_count} car |||| %{smart_count} cars'
  }
});

console.log(polyglot.t('hello', { name: 'Alice' }));
// Output: Hello, Alice

console.log(polyglot.t('cars', { smart_count: 1 }));
// Output: 1 car

console.log(polyglot.t('cars', { smart_count: 5 }));
// Output: 5 cars
```

## Documentation

Run the demo:

```bash
elide run elide-polyglot.ts
```

## Links

- [Original npm package](https://www.npmjs.com/package/node-polyglot)
- [Airbnb's Polyglot](http://airbnb.io/polyglot.js/)

---

**Built with ❤️ for the Elide Polyglot Runtime**
