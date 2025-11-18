# numeral - Elide Polyglot Showcase

> **One number formatter for ALL languages** - TypeScript, Python, Ruby, and Java

Format and manipulate numbers with ease.

## Features

- Number formatting
- Currency formatting
- Percentage formatting
- Time formatting
- Bytes formatting
- Custom formats
- Zero dependencies
- **~500K downloads/week on npm**

## Quick Start

```typescript
import numeral from './elide-numeral.ts';

console.log(numeral(1000).format('0,0')); // 1,000
console.log(numeral(1234.56).format('$0,0.00')); // $1,234.56
console.log(numeral(0.75).format('0.00%')); // 75.00%
console.log(numeral(1024).format('0b')); // 1.00 KB

const n = numeral(100);
n.add(50).multiply(2);
console.log(n.format('$0,0.00')); // $300.00
```

## Documentation

Run the demo:

```bash
elide run elide-numeral.ts
```

## Links

- [Original npm package](https://www.npmjs.com/package/numeral)
- [Numeral.js Documentation](http://numeraljs.com/)

---

**Built with ❤️ for the Elide Polyglot Runtime**
