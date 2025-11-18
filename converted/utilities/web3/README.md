# web3 - Elide Polyglot Showcase

> **Ethereum JavaScript API for ALL languages** - TypeScript, Python, Ruby, and Java

## Features

- Ethereum JSON-RPC client
- Smart contract interaction
- Account management
- Transaction signing
- **~500K+ downloads/week on npm**

## Quick Start

```typescript
import Web3 from './elide-web3.ts';

const web3 = new Web3('https://mainnet.infura.io/v3/YOUR_PROJECT_ID');

// Convert units
web3.utils.toWei('1', 'ether'); // '1000000000000000000'
web3.utils.fromWei('1000000000000000000', 'ether'); // '1.0'

// Get blockchain data
await web3.eth.getBlockNumber(); // Current block
await web3.eth.getBalance('0xAddress'); // Account balance
await web3.eth.getGasPrice(); // Current gas price
```

## Links

- [Original npm package](https://www.npmjs.com/package/web3)

---

**Built with ❤️ for the Elide Polyglot Runtime**
