# web3-utils - Elide Polyglot Showcase

> **Web3 Utility Functions for ALL languages** - TypeScript, Python, Ruby, and Java

## Features

- Unit conversion (Wei, Ether, Gwei)
- Address validation and checksumming
- String/hex/number conversions
- Hashing functions
- **~500K+ downloads/week on npm**

## Quick Start

```typescript
import utils from './elide-web3-utils.ts';

// Unit conversions
utils.toWei('1', 'ether'); // '1000000000000000000'
utils.fromWei('1000000000000000000', 'ether'); // '1'

// Address validation
utils.isAddress('0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb'); // true
utils.toChecksumAddress('0x742d35cc6634c0532925a3b844bc9e7595f0beb');

// Conversions
utils.toHex('Hello'); // '0x48656c6c6f'
utils.hexToString('0x48656c6c6f'); // 'Hello'
```

## Links

- [Original npm package](https://www.npmjs.com/package/web3-utils)

---

**Built with ❤️ for the Elide Polyglot Runtime**
