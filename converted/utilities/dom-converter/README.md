# DOM Converter - Elide Polyglot Showcase

> **One DOM converter for ALL languages** - TypeScript, Python, Ruby, and Java

Utilities for converting between different DOM representations.

## Features

- DOM to JSON conversion
- JSON to DOM conversion
- HTML to object conversion
- Serialization/deserialization
- Deep cloning
- **~500K downloads/week on npm**

## Quick Start

```typescript
import { DOMConverter } from './elide-dom-converter.ts';

const element = document.querySelector('.container');

// Convert to JSON
const json = DOMConverter.toJSON(element);
console.log(json);

// Convert back to DOM
const newElement = DOMConverter.fromJSON(json);

// Serialize/deserialize
const serialized = DOMConverter.serialize(element);
const deserialized = DOMConverter.deserialize(serialized);

// Clone element
const cloned = DOMConverter.clone(element);
```

## Links

- [Original npm package](https://www.npmjs.com/package/dom-converter)

---

**Built with ❤️ for the Elide Polyglot Runtime**
