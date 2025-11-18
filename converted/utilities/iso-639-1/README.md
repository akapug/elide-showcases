# iso-639-1 - Elide Polyglot Showcase

> **One language code library for ALL languages** - TypeScript, Python, Ruby, and Java

ISO 639-1 two-letter language code library.

## Features

- Get language name from code
- Get code from language name
- Validate language codes
- Get all languages
- Native names support
- Bidirectional lookup
- Zero dependencies
- **~100K downloads/week on npm**

## Quick Start

```typescript
import iso639 from './elide-iso-639-1.ts';

console.log(iso639.getName('en')); // English
console.log(iso639.getNativeName('ja')); // 日本語
console.log(iso639.getCode('Spanish')); // es
console.log(iso639.validate('en')); // true

const all = iso639.getAllCodes();
console.log(all); // ['en', 'es', 'fr', ...]
```

## Documentation

Run the demo:

```bash
elide run elide-iso-639-1.ts
```

## Links

- [Original npm package](https://www.npmjs.com/package/iso-639-1)
- [ISO 639-1 Standard](https://en.wikipedia.org/wiki/ISO_639-1)

---

**Built with ❤️ for the Elide Polyglot Runtime**
