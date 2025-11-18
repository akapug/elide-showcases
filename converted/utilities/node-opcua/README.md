# node-opcua - Elide Polyglot Showcase

> **OPC UA protocol for ALL languages** - ~20K+/week

## Features

- OPC UA client and server
- Industrial IoT standard
- Secure communication
- **~20K+ downloads/week on npm**

## Quick Start

```typescript
import { OPCUAClient } from './elide-node-opcua.ts';

const client = new OPCUAClient();
await client.connect('opc.tcp://localhost:4840');
const value = await client.readVariableValue('ns=1;s=Temperature');
```

## Links

- [Original npm package](https://www.npmjs.com/package/node-opcua)

---

**Built with ❤️ for the Elide Polyglot Runtime**
