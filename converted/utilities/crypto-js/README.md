# CryptoJS - Elide Polyglot Showcase

> **One crypto library for ALL languages**

Comprehensive cryptography library for encryption, hashing, and authentication.

## 🚀 Quick Start

```typescript
import CryptoJS from './elide-crypto-js.ts';

// Encrypt
const encrypted = await CryptoJS.AES.encrypt('message', 'secret');

// Decrypt
const decrypted = await CryptoJS.AES.decrypt(encrypted, 'secret');

// Hash
const hash = await CryptoJS.SHA256('hello');

// HMAC
const hmac = await CryptoJS.HmacSHA256('message', 'secret');
```

## 📝 Package Stats

- **npm downloads**: ~25M/week
- **Use case**: Encryption, hashing, authentication

---

**Built with ❤️ for the Elide Polyglot Runtime**
