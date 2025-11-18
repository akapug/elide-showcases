# bip39 - Elide Polyglot Showcase

> **Mnemonic Code Generator for ALL languages** - TypeScript, Python, Ruby, and Java

## Features

- Generate mnemonic phrases (12, 15, 18, 21, 24 words)
- Validate mnemonics
- Convert mnemonic to seed
- Multiple languages support
- **~200K+ downloads/week on npm**

## Quick Start

```typescript
import { generateMnemonic, validateMnemonic, mnemonicToSeedSync } from './elide-bip39.ts';

// Generate 12-word mnemonic
const mnemonic = generateMnemonic(); // 128-bit

// Generate 24-word mnemonic
const longMnemonic = generateMnemonic(256);

// Validate mnemonic
const isValid = validateMnemonic(mnemonic);

// Convert to seed
const seed = mnemonicToSeedSync(mnemonic, 'optional-password');
```

## Links

- [Original npm package](https://www.npmjs.com/package/bip39)

---

**Built with ❤️ for the Elide Polyglot Runtime**
