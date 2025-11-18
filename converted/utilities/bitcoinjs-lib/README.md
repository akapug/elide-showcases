# bitcoinjs-lib - Elide Polyglot Showcase

> **Bitcoin Library for ALL languages** - TypeScript, Python, Ruby, and Java

## Features

- Transaction creation and signing
- Address generation (P2PKH, P2SH, P2WPKH, P2WSH)
- Script building and parsing
- HD wallet support
- **~100K+ downloads/week on npm**

## Quick Start

```typescript
import { ECPair, payments, TransactionBuilder, networks } from './elide-bitcoinjs-lib.ts';

// Generate key pair
const keyPair = ECPair.makeRandom();

// Create address
const { address } = payments.p2pkh({ pubkey: keyPair.publicKey });

// Build transaction
const txb = new TransactionBuilder();
txb.addInput('txhash', 0);
txb.addOutput(address, 50000);
txb.sign(0, keyPair);
const tx = txb.build();
```

## Links

- [Original npm package](https://www.npmjs.com/package/bitcoinjs-lib)

---

**Built with ❤️ for the Elide Polyglot Runtime**
