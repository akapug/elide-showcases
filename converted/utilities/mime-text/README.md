# MIME Text - MIME Text Encoding/Decoding

Encode and decode MIME text headers.

## Quick Start

```typescript
import { encode, decode } from './elide-mime-text.ts';

const encoded = encode("Hello, Ñoño!", 'Q');
const decoded = decode(encoded);
```
