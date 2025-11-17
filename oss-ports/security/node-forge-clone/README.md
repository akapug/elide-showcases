# @elide/forge

Production-ready cryptography toolkit for Elide applications. Complete implementation of cryptographic operations including RSA, AES, certificates, hashing, and more.

## Features

- **RSA**: Key generation, encryption/decryption, digital signatures
- **AES**: Symmetric encryption with multiple modes (CBC, GCM, CTR)
- **PKI**: X.509 certificate generation and management
- **Hash Functions**: MD5, SHA-1, SHA-256, SHA-384, SHA-512
- **HMAC**: Hash-based message authentication
- **Random**: Cryptographically secure random number generation
- **TypeScript First**: Full TypeScript support
- **Zero Dependencies**: Lightweight using Node.js crypto

## Installation

```bash
npm install @elide/forge
```

## Quick Start

### RSA Key Generation

```typescript
import { generateKeyPair } from '@elide/forge';

const keyPair = await generateKeyPair({ bits: 2048 });
console.log(keyPair.publicKey);
console.log(keyPair.privateKey);
```

### RSA Encryption

```typescript
import { publicEncrypt, privateDecrypt } from '@elide/forge';

const encrypted = publicEncrypt(publicKey, 'Secret message');
const decrypted = privateDecrypt(privateKey, encrypted);
```

### Digital Signatures

```typescript
import { rsaSign, rsaVerify } from '@elide/forge';

const signature = rsaSign(privateKey, 'Message to sign');
const isValid = rsaVerify(publicKey, 'Message to sign', signature);
```

### AES Encryption

```typescript
import { aesEncrypt, aesDecrypt } from '@elide/forge';

const key = Buffer.from('your-256-bit-key');
const { ciphertext, iv, tag } = aesEncrypt(key, 'Secret data', { mode: 'gcm' });
const decrypted = aesDecrypt(key, ciphertext, iv, { mode: 'gcm', tag });
```

### Hashing

```typescript
import { sha256, createHMAC } from '@elide/forge';

const hash = sha256('data to hash');
const hmac = createHMAC('sha256', 'secret-key', 'data');
```

### Random Generation

```typescript
import { randomBytes, randomPassword, randomUUID } from '@elide/forge';

const bytes = randomBytes(32);
const password = randomPassword(16);
const uuid = randomUUID();
```

## Complete API Documentation

See [API Documentation](./docs/api.md) for full reference.

## License

MIT
