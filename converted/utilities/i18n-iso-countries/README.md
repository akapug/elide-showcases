# i18n-iso-countries - Elide Polyglot Showcase

> **One country data library for ALL languages** - TypeScript, Python, Ruby, and Java

i18n for ISO 3166-1 country codes with localized country names.

## Features

- Convert country codes (alpha-2, alpha-3, numeric)
- Get localized country names
- Multiple language support
- Validate country codes
- Get all countries
- Reverse lookup
- Zero dependencies
- **~200K downloads/week on npm**

## Quick Start

```typescript
import countries from './elide-i18n-iso-countries.ts';

console.log(countries.getName('US', 'en')); // United States
console.log(countries.getName('US', 'es')); // Estados Unidos
console.log(countries.getAlpha3Code('US')); // USA
console.log(countries.getAlpha2Code('United States', 'en')); // US

const all = countries.getNames('en');
console.log(all); // { US: 'United States', GB: 'United Kingdom', ... }
```

## Documentation

Run the demo:

```bash
elide run elide-i18n-iso-countries.ts
```

## Links

- [Original npm package](https://www.npmjs.com/package/i18n-iso-countries)
- [ISO 3166-1 Standard](https://en.wikipedia.org/wiki/ISO_3166-1)

---

**Built with ❤️ for the Elide Polyglot Runtime**
