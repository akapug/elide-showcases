# Quoted Printable - Quoted-Printable Encoding

Encode/decode quoted-printable strings.

Based on https://www.npmjs.com/package/quoted-printable (~200K+ downloads/week)

## Quick Start

```typescript
import { encode, decode } from './elide-quoted-printable.ts';

const encoded = encode("Hello, Ñoño!");
const decoded = decode(encoded);
```
