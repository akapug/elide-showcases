# bip32 - Elide Polyglot Showcase

> **HD Wallet Key Derivation for ALL languages**

## Features

- BIP32 key derivation
- Extended keys (xprv, xpub)
- **~100K+ downloads/week on npm**

## Quick Start

\`\`\`typescript
import { fromSeed } from './elide-bip32.ts';
const root = fromSeed(seed);
const child = root.derivePath("m/44'/0'/0'/0/0");
\`\`\`

---

**Built with ❤️ for the Elide Polyglot Runtime**
