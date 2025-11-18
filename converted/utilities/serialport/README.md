# serialport - Elide Polyglot Showcase

> **Serial port communication for ALL languages** - TypeScript, Python, Ruby, and Java

## Features

- Read/write serial data
- Auto-detect ports
- Configurable baud rates
- Multiple parsers (Readline, Delimiter, ByteLength)
- **~200K+ downloads/week on npm**

## Quick Start

```typescript
import SerialPort from './elide-serialport.ts';

const port = new SerialPort('/dev/ttyUSB0', { baudRate: 9600 });

port.on('open', () => {
  console.log('Port opened!');
  port.write('Hello Arduino!\n');
});

port.on('data', (data) => {
  console.log('Received:', data.toString());
});
```

## Links

- [Original npm package](https://www.npmjs.com/package/serialport)

---

**Built with ❤️ for the Elide Polyglot Runtime**
