# Buffer - Binary Data Handling for Elide

Complete Buffer implementation for cross-platform binary data handling.

**POLYGLOT**: Use the same Buffer API across JavaScript, Python, Ruby, and Java with Elide!

Based on [buffer](https://www.npmjs.com/package/buffer) (~10M+ downloads/week)

## Features

- Full Buffer API compatibility
- String encoding/decoding (UTF-8, Base64, Hex)
- Typed array operations
- Buffer concatenation and comparison
- Integer read/write methods
- Zero dependencies

## Quick Start

```typescript
import { Buffer } from './elide-buffer.ts';

// Create buffers
const buf1 = Buffer.from('Hello, World!');
const buf2 = Buffer.alloc(10);
const buf3 = Buffer.from([1, 2, 3, 4, 5]);

// String encoding
console.log(buf1.toString('hex'));
console.log(buf1.toString('base64'));

// Operations
buf2.fill(0x42);
buf1.copy(buf2, 0, 0, 5);
const combined = Buffer.concat([buf1, buf2]);

// Comparison
console.log(buf1.equals(buf2));
console.log(Buffer.compare(buf1, buf2));
```

## Polyglot Examples

### JavaScript/TypeScript
```typescript
const buf = Buffer.from('Hello');
console.log(buf.toString('base64'));
```

### Python (via Elide)
```python
# Same Buffer API available in Python!
buf = Buffer.from_('Hello')
print(buf.to_string('base64'))
```

### Ruby (via Elide)
```ruby
# Same Buffer API available in Ruby!
buf = Buffer.from('Hello')
puts buf.to_string('base64')
```

### Java (via Elide)
```java
// Same Buffer API available in Java!
var buf = Buffer.from("Hello");
System.out.println(buf.toString("base64"));
```

## Use Cases

- **Binary File I/O**: Read and write binary files
- **Network Protocols**: Handle TCP/UDP packets
- **Cryptography**: Hash functions and encryption
- **Data Serialization**: Protocol Buffers, MessagePack
- **Image Processing**: Pixel manipulation

## Why Polyglot?

- ✓ One binary data API across all languages
- ✓ Consistent byte manipulation everywhere
- ✓ Share binary protocols across your stack
- ✓ No language-specific buffer libraries needed
- ✓ Perfect for microservices architecture

## Performance

- Zero dependencies
- Native typed array backing
- ~10M+ downloads/week on npm
- Fast encoding/decoding operations
