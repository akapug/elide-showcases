# modbus-serial - Elide Polyglot Showcase

> **Modbus protocol for ALL languages** - ~30K+/week

## Features

- Modbus RTU and TCP
- Read/write registers
- Industrial automation
- **~30K+ downloads/week on npm**

## Quick Start

```typescript
import { ModbusRTU } from './elide-modbus-serial.ts';

const client = new ModbusRTU();
client.connectTCP('192.168.1.100', { port: 502 });
client.setID(1);
client.readHoldingRegisters(0, 10, (err, data) => {
  console.log(data);
});
```

## Links

- [Original npm package](https://www.npmjs.com/package/modbus-serial)

---

**Built with ❤️ for the Elide Polyglot Runtime**
