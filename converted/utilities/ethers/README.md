# ethers - Elide Polyglot Showcase

> **Complete Ethereum Library for ALL languages** - TypeScript, Python, Ruby, and Java

## Features

- Full Ethereum wallet management
- Contract interaction (ABI encoding/decoding)
- Provider abstraction
- Transaction signing and sending
- **~1M+ downloads/week on npm**

## Quick Start

```typescript
import { Wallet, JsonRpcProvider, utils } from './elide-ethers.ts';

// Create wallet
const wallet = Wallet.createRandom();

// Convert units
const oneEth = utils.parseEther("1.0");
utils.formatEther(oneEth); // "1.0"

// Provider operations
const provider = new JsonRpcProvider();
await provider.getBlockNumber();
await provider.getBalance(wallet.address);
```

## Links

- [Original npm package](https://www.npmjs.com/package/ethers)

---

**Built with ❤️ for the Elide Polyglot Runtime**
