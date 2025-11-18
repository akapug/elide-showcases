# MD5 - Elide Polyglot Showcase

> **One MD5 library for ALL languages**

MD5 hashing for checksums and ETags (not for security).

## 🚀 Quick Start

```typescript
import md5 from './elide-md5.ts';

const hash = await md5('hello');
const checksum = await md5(fileContent);
const etag = `"${await md5(response)}"`;
```

## ⚠️ Security Note

MD5 is NOT cryptographically secure. Use SHA-256 for security purposes.

## 📝 Package Stats

- **npm downloads**: ~15M/week
- **Use case**: Checksums, ETags, non-security hashing

---

**Built with ❤️ for the Elide Polyglot Runtime**
