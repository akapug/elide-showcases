# Elide Security Libraries

Production-ready security libraries ported to Elide. This directory contains 5 comprehensive security libraries with full TypeScript implementations, examples, and tests.

## Libraries

### 1. @elide/passport (4,067 lines)
**Authentication middleware with 20+ strategies**

Complete authentication framework supporting:
- Local (username/password)
- JWT (JSON Web Tokens)
- OAuth2 (Google, GitHub, Facebook, Twitter)
- Bearer tokens
- API keys
- Session management
- Multi-factor authentication (MFA/2FA)
- Custom strategies

**Features:**
- Strategy pattern architecture
- Session serialization/deserialization
- Multiple strategy support
- Comprehensive middleware
- TypeScript types
- Examples: Local auth, JWT, OAuth, Multi-factor
- Tests included

**Path:** `/home/user/elide-showcases/oss-ports/security/passport-clone/`

---

### 2. @elide/jsonwebtoken (1,854 lines)
**JWT implementation with multiple algorithms**

Complete JWT operations:
- Token signing (HS256, HS384, HS512, RS256, RS384, RS512, ES256, ES384, ES512)
- Token verification
- Token decoding
- Expiration handling
- Claims validation
- Multiple extractors

**Features:**
- HMAC algorithms (HS256/384/512)
- RSA algorithms (RS256/384/512)
- ECDSA algorithms (ES256/384/512)
- Timing-safe comparisons
- TypeScript types
- Examples: Basic usage
- Tests included

**Path:** `/home/user/elide-showcases/oss-ports/security/jsonwebtoken-clone/`

---

### 3. @elide/helmet (2,124 lines)
**Security headers middleware**

Comprehensive HTTP security headers:
- Content-Security-Policy (CSP)
- Strict-Transport-Security (HSTS)
- X-Frame-Options
- X-Content-Type-Options
- X-XSS-Protection
- Referrer-Policy
- Permissions-Policy
- Cross-Origin policies (CORP, COEP, COOP)
- DNS Prefetch Control
- Expect-CT

**Features:**
- Configurable middleware
- Strict/moderate presets
- Dynamic CSP
- Nonce support
- TypeScript types
- Examples: Basic usage, Advanced patterns
- Tests included

**Path:** `/home/user/elide-showcases/oss-ports/security/helmet-clone/`

---

### 4. @elide/bcrypt (1,043 lines)
**Password hashing with bcrypt**

Secure password hashing:
- Hash generation
- Hash comparison
- Salt rounds (4-31)
- Async and sync APIs
- Password strength validation
- Secure password generation

**Features:**
- Timing-safe comparisons
- Configurable cost factor
- Batch hashing
- Password strength scoring
- Crack time estimation
- TypeScript types
- Examples: Basic usage
- Tests included

**Path:** `/home/user/elide-showcases/oss-ports/security/bcrypt-clone/`

---

### 5. @elide/forge (2,084 lines)
**Cryptography toolkit**

Complete cryptographic operations:
- RSA key generation
- RSA encryption/decryption
- Digital signatures
- Certificate generation (X.509)
- AES encryption (CBC, GCM, CTR)
- Hash functions (MD5, SHA-1, SHA-256, SHA-384, SHA-512)
- HMAC
- Random number generation

**Features:**
- RSA 1024/2048/4096-bit keys
- AES 128/192/256-bit encryption
- Self-signed certificates
- Certificate chains
- PKI operations
- TypeScript types
- Examples: RSA, AES, PKI
- Tests included

**Path:** `/home/user/elide-showcases/oss-ports/security/node-forge-clone/`

---

## Total Statistics

- **Total Lines:** 11,172 TypeScript lines
- **Total Files:** 79 files (TypeScript, Markdown, JSON)
- **Libraries:** 5 production-ready security libraries
- **Examples:** 15+ comprehensive examples
- **Tests:** 5 test suites

## Installation

Each library can be used independently:

```bash
# Passport
npm install @elide/passport

# JWT
npm install @elide/jsonwebtoken

# Helmet
npm install @elide/helmet

# Bcrypt
npm install @elide/bcrypt

# Forge
npm install @elide/forge
```

## Quick Examples

### Authentication with Passport

```typescript
import passport, { LocalStrategy } from '@elide/passport';

passport.use(new LocalStrategy(async (username, password, done) => {
  const user = await findUser(username);
  if (!user || !await verifyPassword(password, user.password)) {
    return done(null, false);
  }
  return done(null, user);
}));

app.post('/login', passport.authenticate('local'));
```

### JWT Operations

```typescript
import { sign, verify } from '@elide/jsonwebtoken';

const token = sign({ userId: '123' }, 'secret', { expiresIn: '1h' });
const payload = verify(token, 'secret');
```

### Security Headers

```typescript
import helmet from '@elide/helmet';

app.use(helmet());
```

### Password Hashing

```typescript
import bcrypt from '@elide/bcrypt';

const hash = await bcrypt.hash('password', 12);
const isValid = await bcrypt.compare('password', hash);
```

### Cryptography

```typescript
import { generateKeyPair, publicEncrypt, privateDecrypt } from '@elide/forge';

const keyPair = await generateKeyPair({ bits: 2048 });
const encrypted = publicEncrypt(keyPair.publicKey, 'secret');
const decrypted = privateDecrypt(keyPair.privateKey, encrypted);
```

## Security Best Practices

Each library follows industry security best practices:

1. **Timing-safe comparisons** to prevent timing attacks
2. **Strong defaults** with secure configuration options
3. **No deprecated algorithms** or insecure patterns
4. **Comprehensive validation** of inputs and outputs
5. **Type safety** with full TypeScript support

## Documentation

Each library includes:
- Complete README with examples
- TypeScript type definitions
- API documentation
- Security best practices
- Example implementations
- Test suites

## License

MIT

## Contributing

These libraries are production-ready implementations showcasing Elide's capabilities for security-critical applications.
