# hdkey - Elide Polyglot Showcase

> **HD Key Derivation for ALL languages** - TypeScript, Python, Ruby, and Java

## Features

- HD key derivation (BIP32)
- Extended key serialization
- Path-based derivation
- **~150K+ downloads/week on npm**

## Quick Start

```typescript
import HDKey from './elide-hdkey.ts';

const seed = new Uint8Array(64);
const hdkey = HDKey.fromMasterSeed(seed);
const child = hdkey.derive("m/44'/0'/0'/0/0");
```

## Links

- [Original npm package](https://www.npmjs.com/package/hdkey)

---

**Built with ❤️ for the Elide Polyglot Runtime**
